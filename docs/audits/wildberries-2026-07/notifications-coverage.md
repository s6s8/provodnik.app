# Notification coverage matrix (Task C7, item 8)

Source of truth: `src/lib/notifications/triggers.ts`, `src/lib/email/send-notification-email.ts`,
`src/lib/flags.ts`, at `cbcffe67` + this branch. Verified by tracing every caller, not by
reading the module's exports.

## Headline

**The plan's premise was wrong.** It assumed "the stack exists end-to-end; the gap is env
drift". It is not. Of the seven notification triggers, **only two can deliver an email in
production**. The rest are either in-app-only or have no caller at all.

That — not a missing `RESEND_API_KEY` — is the substance of item 8 («настроить уведомления»).

## The matrix

| # | Event | Trigger exists | Has a production caller | Sends **email** | Status |
|---|---|---|---|---|---|
| 1 | New offer → traveler | ✅ `notifyNewOffer` | ✅ `guide/offer-actions.ts` | ✅ | **works** |
| 2 | Booking created → guide | ✅ `notifyBookingCreated` | ✅ `requests/owner-request-actions.ts` | ✅ | **works** |
| 3 | Booking confirmed | ✅ `notifyBookingConfirmed` | ❌ **none** | ❌ in-app only | **dead** |
| 4 | Booking cancelled | ✅ `notifyBookingCancelled` | ❌ **none** | ⚠️ email code exists but is unreachable | **dead** |
| 5 | Review requested | ✅ `notifyReviewRequested` | ❌ **none** | ❌ | **dead** |
| 6 | Dispute opened | ✅ `notifyDisputeOpened` | ✅ `disputes/actions/openDispute.ts` | ❌ in-app only | **no email** |
| 7 | New request → matching guides | ✅ `notifyGuidesNewRequest` | ✅ `requests/create-request-actions.ts` | ❌ in-app only | **no email** |

Rows 3, 4 and 5 have **zero** callers anywhere in `src/` outside their own module and tests.
They are dead code today: no amount of environment configuration will make them fire.

Row 7 is the most commercially significant gap: a traveler posts a request, matching guides
get an in-app notification only. If a guide is not in the app at that moment, they learn
nothing. Marketplace liquidity depends on that email.

## Corrections to the plan's stated facts

1. **`FEATURE_TR_NOTIFICATIONS` does not gate email.** It gates exactly two things: the
   `/account/notifications` settings page and the header bell (`site-header-server.tsx:19`).
   `sendNotificationEmail` never reads it. Emails send whenever `RESEND_API_KEY` is set.
   Flipping this flag on in prod will **not** turn on emails, and flipping it off will not
   turn them off. The plan asserted the triggers are "gated by `FEATURE_TR_NOTIFICATIONS` +
   `RESEND_API_KEY`". Only the second half is true.

2. **The stack is not "seven triggers behind a flag".** It is two live email paths, two
   in-app-only paths, and three dead ones.

## Idempotency — checked, and it holds

`notification_email_log` has `PRIMARY KEY (kind, entity_id)`. `sendNotificationEmail` inserts
a reservation row first and treats a `23505` unique violation as "already sent" (returns
silently). Retrying an event therefore cannot double-send.

**The trap this creates, and why the code is already safe:** the key does *not* include
`recipient`. So an event that must email two different people under one `kind` would collide,
and the second person's mail would be silently dropped. The one multi-recipient email path
(`notifyBookingCancelled`) already sidesteps this by folding the recipient into the entity id:

```ts
entityId: `${parsedBookingId}:${recipient.userId}`
```

The two live paths (`new_offer`, `booking_created`) each have exactly one recipient, so they
are safe as written.

⚠️ **This is a landmine for whoever wires up rows 3–7.** Any new multi-recipient email MUST
use the `${entityId}:${userId}` form. A plain `entityId` will silently deliver to the first
recipient only — and the failure is invisible, because the log row will look like a success.

## Environment configuration — NOT verified (external gate)

`RESEND_API_KEY` and `FEATURE_TR_NOTIFICATIONS` must be checked on Vercel prod, Vercel preview,
and the Mac mini staging box. This run has no access to any of them, so **this is unverified,
not verified-good.**

Operator checklist:

```bash
vercel env ls production | grep -E "RESEND_API_KEY|FEATURE_TR_NOTIFICATIONS"
vercel env ls preview    | grep -E "RESEND_API_KEY|FEATURE_TR_NOTIFICATIONS"
# Mac mini staging: check its .env
```

Note the asymmetry above when you read the result: a missing `RESEND_API_KEY` breaks emails 1
and 2. A missing `FEATURE_TR_NOTIFICATIONS` breaks the settings page and the bell — **not**
the emails.

## Deliverability proof — NOT performed (external gate)

Requires a staging environment with a real Resend key. Not runnable from this isolated
workspace. When an operator does it:

1. Trigger a new offer and a booking creation on staging.
2. Show the resulting `notification_email_log` rows (`sent_at` populated, provider message id).
3. Show the received mail.
4. Re-trigger the same event → assert **no** second row and **no** second send (idempotency).

## Recommended follow-up cards (NOT done here — out of C7's audit scope)

| Card | Why |
|---|---|
| **N-1: email guides about matching new requests** (row 7) | Highest commercial value. Guides currently only find out in-app. Use the `${entityId}:${userId}` entity-id form — it is inherently multi-recipient. |
| **N-2: wire or delete rows 3–5** | `notifyBookingConfirmed`, `notifyBookingCancelled`, `notifyReviewRequested` are dead. Either call them from the booking/review state transitions or delete them. Dead notification code reads as coverage that does not exist — it is how this gap survived. |
| **N-3: email on dispute opened** (row 6) | A dispute is time-critical; in-app-only is too quiet. |
| **N-4: decide what `FEATURE_TR_NOTIFICATIONS` actually gates** | Today its name promises more than it does. Either make it gate email sending too, or rename it. |
