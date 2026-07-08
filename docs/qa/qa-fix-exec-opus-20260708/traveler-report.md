# Traveler role QA report — provodnik.app (production)

**Date:** 2026-07-08
**Target:** https://provodnik.app
**Account:** qa-traveler@example.com (role: traveler)
**Tooling:** standalone Playwright (Chromium) driver scripts under `/tmp/provodnik-role-qa-20260708/`, run against production with credentials loaded from the repo's `.env.local` (`QA_SEED_PASSWORD`). No secrets are printed below.

## Scope

Per `traveler-task.md`: login/logout + route protection, public catalog routes, traveler account/dashboard surfaces, traveler request creation with a QA-labeled request, guide search, booking/offer acceptance coverage, listing booking route, validation errors, and console/network + mobile check on the highest-risk flow.

## Routes tested

**Public / catalog**
- `/` (home) — OK
- `/guides` — OK, QA Guide visible in listing
- `/guides/[slug]` (guide detail, e.g. `qa-guide-test-904cdd5c`) — OK
- `/listings` and `/listings/[id]` — **404** (see Issues; feature-flagged off, not a bug)
- `/requests` (public open-groups marketplace) — OK
- `/requests/[id]` (existing open group / offer detail) — OK when the id is valid; **404** for one notification-linked id (see Issues)
- `/how-it-works`, `/destinations` — OK

**Traveler account**
- `/trips` ("Мои поездки" — Активные / Подтверждённые / Мои группы tabs) — OK, with a rendering bug in the Подтверждённые tab (see Issues)
- `/favorites` — intentional "coming soon" placeholder, not a bug
- `/notifications` — OK, shows 1 unread "Новое предложение от QA Guide" — its deep link is broken (see Issues)
- `/messages` — OK, empty state
- `/account` (traveler profile edit — this is the actual profile page; `/profile` does not exist as a route, see below) — OK
- `/account/notifications` — OK
- `/bookings` (no index page exists in the codebase, only `/bookings/[bookingId]`) — 404, **expected**, not a bug
- `/bookings/[bookingId]` (direct link to the one confirmed booking) — OK, fully populated except a broken contacts widget (see Issues)
- `/profile` — 404, **expected** (no page.tsx in that route folder — it only holds server actions used by `/account`)
- `/form` (traveler request creation — note: this resolves to `/`, the request form is the homepage hero, not a separate route) — OK

## Flows tested

1. **Route protection while logged out**: `/trips` → redirected to `/auth?next=%2Ftrips`. Correct.
2. **Login**: qa-traveler@example.com logged in successfully, landed on `/trips`.
3. **Logout**: found via the account-menu dropdown in the header (avatar trigger `aria-label="Меню аккаунта: …"` → "Выйти"). Confirmed working — header reverts to "Войти / Стать гидом" afterward.
4. **Guide search**: "QA Guide Test" is visible and reachable at `/guides/qa-guide-test-904cdd5c`.
5. **Traveler request creation**: filled destination (Казань), picked a date via the calendar popover, picked a theme ("История и культура"), expanded "Детали" and filled notes with `ROLEQA-20260708-traveler-20260708-1400`, submitted. Request was created successfully — confirmed present on `/requests` as "Казань" with "Это ваша группа" and initials "QT" (QA Traveler), and under `/trips → Активные (1)`.
6. **Empty-form validation**: both the login form and the request form allow submit-click with empty required fields but show clear inline Russian validation messages afterward ("Укажите город или направление.", "Укажите дату начала.", "Выберите хотя бы одну категорию.") without creating bad data. Working as intended.
7. **Join an open group** ("Присоединиться" on a `Сборные группы` card on the homepage): navigates correctly to `/requests/[id]` (confirmed after fixing a race condition in the test script — the link itself works fine).
8. **Booking/approval coverage**: the QA traveler account already has **one confirmed booking** (`/bookings/30212d35-…`) with QA Guide, showing full trip/cost/payment-agreement details and a "Подтвердить договорённость" (confirm payment agreement) action still pending on both sides. I deliberately **did not click "Подтвердить договорённость" or "Отменить бронирование"**, since this booking is a shared fixture likely also used by the concurrent guide/admin role QA passes, and confirming or cancelling it would mutate shared state those tests may depend on. This is flagged as a blocker/judgment call, not a defect.
9. **New-offer notification → accept flow**: the one unread notification ("Новое предложение от QA Guide") links to `/requests/d2b57384-…`, which **404s** — this is the actual blocker preventing an "accept a brand-new offer" walkthrough (distinct from the already-confirmed booking in #8). See Issues.
10. **Listing booking route** `/listings/[id]/book`: could not be exercised — `/listings` itself 404s because `FEATURE_PUBLIC_CATALOG` is off in production (confirmed in source: `src/app/(site)/listings/page.tsx`). Not a bug, an active feature flag.
11. **Mobile (375×812)**: repeated login, `/guides`, and `/form` (homepage) — layouts render correctly, no overflow or broken controls observed.

## Evidence artifacts

All screenshots under `/tmp/provodnik-role-qa-20260708/traveler-screens/` (42 files), notably:
- `00-trips-logged-out-redirect.png`, `02-post-login.png` — auth/route-protection
- `route-_guides.png`, `guide-detail.png` — guide search/detail
- `form-filled.png`, `followup-03-form-complete.png`, `followup-04-after-submit.png`, `followup-05-requests-list.png` — request creation
- `trips-confirmed-tab.png` — blank confirmed-booking card (Issue 1)
- `booking-detail-direct.png` — confirmed booking detail + broken contacts widget (Issue 2)
- `notification-offer-target.png` — 404 from the offer notification (Issue 3)
- `route-_listings.png`, `group-join-landing.png` — flag-gated catalog / group-join
- `mobile-01-post-login.png`, `mobile-02-guides.png`, `mobile-04-form.png` — mobile pass
- `logout-menu-open.png`, `logout-attempt.png` — logout

Raw structured data: `traveler-events.json`, `traveler-followup-events.json`, `traveler-trips-events.json`, `traveler-confirmed-probe.json`, `traveler-booking-detail.json`, `traveler-notif-offer.json` (all in the QA output folder).

## Issues

| # | Severity | Category | Steps | Expected | Actual | Evidence |
|---|----------|----------|-------|----------|--------|----------|
| 1 | **High** | Booking/UI defect | Log in as traveler → `/trips` → open "Подтверждённые" tab (badge shows count 1) | Confirmed-booking card shows guide name, date, price like the detail page does | Card renders only a lone em-dash `—` as its title; DOM shows `<article><h3>—</h3></article>` with no other fields at all, though the underlying booking record is fully populated (verified via the detail page) | `trips-confirmed-tab.png`; DOM dump in `traveler-confirmed-probe.json` |
| 2 | **High** | Booking flow / broken deep link | Log in as traveler → `/notifications` → click "Открыть событие" on "Новое предложение от QA Guide" | Navigates to the offer/request so the traveler can review and accept it | Navigates to `/requests/d2b57384-c491-466d-b222-75ef0ebdff84` → **404 Страница не найдена** | `notification-offer-target.png`, `traveler-notif-offer.json` |
| 3 | Medium | Data/contact defect | Log in as traveler → open confirmed booking `/bookings/30212d35-…` → "Свяжитесь с гидом напрямую" | Guide contact info (phone/Telegram) loads | Section shows "Не удалось загрузить контакты" (failed to load contacts); no console/network error was captured for it, so the failure is likely server-side/RSC-level | `booking-detail-direct.png` |
| 4 | Low | Production content bug | Load `/` as any user | Homepage hero image renders | `/_next/image?...hero-provodnik.png` and `.../cities/kazan.png` both return **HTTP 400** — the underlying Supabase Storage objects themselves return 400 (verified via direct `curl`), so the hero/city images are broken for every visitor, not just this account | `traveler-events.json` network log; reproduced with `curl` |
| 5 | Info (not a bug) | Feature flag | Visit `/listings` or `/listings/[id]` | — | 404, because `FEATURE_PUBLIC_CATALOG` is intentionally off in production (confirmed in source). Blocks testing item 7 (`/listings/[id]/book`) entirely — no listing page is reachable to reach the book route from. | `route-_listings.png` |
| 6 | Info (not a bug) | Route design | Visit `/bookings` (no id) or `/profile` | — | Both 404 by design — `/bookings` has no index page (only `/bookings/[bookingId]`), and `/profile` has no `page.tsx` (the real traveler profile page is `/account`). My initial route list assumed these existed; corrected during testing. | `route-_bookings.png`, `route-_profile.png` |

## Booking/approval coverage summary

- **Existing confirmed booking**: found, but its presence in the traveler's own "Подтверждённые" list is effectively invisible due to Issue 1 (blank card) — a traveler using the UI as designed would very likely miss that they have a confirmed trip.
- **New-offer acceptance**: blocked end-to-end by Issue 2 — the one unread "new offer" notification's link 404s, so there is no reachable in-app path from "I got an offer" to "I accepted it" for this account.
- **Payment-agreement confirmation** (`Подтвердить договорённость`) on the existing confirmed booking is reachable and both sides show "ожидает" (pending) — intentionally not exercised (see flow #8 above) to avoid corrupting a fixture shared with concurrent guide/admin QA.
- **Listing-based booking** (`/listings/[id]/book`) is entirely unreachable in production right now because the public listings catalog is feature-flagged off.

## Console/network errors

- 6× `400` on `/_next/image` for the homepage hero and a city thumbnail (Issue 4) — real, reproducible, affects all visitors.
- 1× `404` on `/requests/d2b57384-…` (Issue 2).
- 2× `404` on `/bookings` and 1× `404` on `/profile` — expected, non-issues (see Issue 6).
- Many `net::ERR_ABORTED` entries for `/api/messages/unread-count` — these are the header's unread-badge poll being aborted by the test script navigating away mid-request; normal SPA behavior, not a defect.
- 1× `401` on `/api/messages/unread-count` captured once, right after logout on the homepage — a background poll firing after the session ended; cosmetic, not visible to the user, low priority to fix.
- No uncaught client-side JS exceptions (`pageerror`) were observed in any flow.

## Skipped / unreachable areas

- **Listing detail and listing-based booking** (`/listings/[id]`, `/listings/[id]/book`) — unreachable, `FEATURE_PUBLIC_CATALOG` is off in production.
- **Payment-agreement confirm/cancel actions** on the existing confirmed booking — reachable but intentionally not clicked (shared fixture, see above).
- **Accepting a brand-new guide offer end-to-end** — blocked by the 404 in Issue 2; no alternate reachable entry point to a "new, not-yet-accepted" offer was found during this pass.
- Did not attempt any real payment or contact real users, per constraints.

## Recommendations

1. Fix the confirmed-booking list card in `/trips` (Подтверждённые tab) to render the same summary fields (guide name, date, price) the detail page already has — this looks like a simple missing-field/undefined-title bug in the card component, not a data problem.
2. Fix or remove the dead link behind the "Новое предложение от QA Guide" notification — right now it 404s and fully blocks the accept-an-offer flow from that entry point.
3. Investigate the "Не удалось загрузить контакты" failure on the booking detail page — likely a server-side fetch that's silently failing; traveler currently has no direct-contact fallback for a confirmed guide.
4. Fix the broken hero/city images (`hero-provodnik.png`, `kazan.png` in Supabase Storage) — this is a visible, reproducible defect on the homepage for every visitor, unrelated to auth or role.
5. Consider re-enabling or removing `/listings` entirely rather than leaving a dead, indexable 404 route in production if the public catalog will stay off for a while.
