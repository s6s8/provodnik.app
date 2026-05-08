# Two-Mode Architecture: Биржа + Трипстер

**Date:** 2026-04-16 (revised, late session)
**Author:** orchestrator (post Alex Slack ts 1776353334.780179)
**Status:** Approved (option A — both listing shapes route to Трипстер-mode by default)
**Related:**
- Audit: `.claude/logs/report-2026-04-16-alex-resolution.html`
- Plan file: `docs/superpowers/plans/2026-04-16-two-mode-architecture-plan.md`
- Client brief: `.claude/logs/2026-04-16-plan-for-alex.html` (Russian, for Alex)
- Source-of-truth update: `.claude/sot/NEXT_PLAN.md`
- Tripster research: `.claude/research/tripster/03-traveler-side.md`, `04-replication-plan.md`
- Product reference: `docs/product/PRD.md` §13 (three entry points), §11 (MVP scope)

---

## Problem statement

Alex (client) reported in Slack on 2026-04-16 (translated):

> Inside a specific ready tour for a specific city, both buttons "request" and "ask" lead to the same "create request" page. A booking request for a ready Moscow tour leads to the exchange-side request creation — which fundamentally contradicts the entire site concept.
>
> How it should be: Provodnik splits into two business models — exchange (request creation + responsive offers from guides) and the second model "traditional Tripster". You already know how Tripster works.

Concrete code evidence (from morning audit, 2026-04-16):
- `features/listings/components/ExcursionShapeDetail.tsx:103` routes the listing-detail CTA `Запросить у этого гида` to `/traveler/requests/new?guide=[id]` (Биржа-mode entry).
- `features/listings/components/TourShapeDetail.tsx:96` correctly routes `Заказать тур` to `/listings/[id]/book` (Трипстер-mode entry).
- `features/booking/components/BookingFormTabs.tsx` exists with two tabs ("Заказать" / "Задать вопрос") matching Tripster's `travelers-booking-mfe` pattern (per research file 03 §3 line 89). It is already used by Tour shape but unused by Excursion shape.

**Underlying cause:** the two modes are partially built — schema, components, routes all exist. Wiring is wrong on Excursion shape, and there is no user-education layer telling visitors that two modes exist before they click anything.

## Mission alignment

**PRD §13 traveler flow** explicitly enumerates three entry points:

> Traveler enters the platform and chooses region, dates, budget, or format. Traveler either:
> - finds an existing tour
> - joins an existing group request
> - creates a new request

Alex's "two modes" cleanly groups these:
- **Трипстер-mode** = "finds an existing tour" → direct booking from listing detail.
- **Биржа-mode** = "creates a new request" + "joins an existing group request" → request wizard, guides bid, traveler accepts.

This is faithful to the PRD, not a deviation.

## V1 scope alignment

V1 scope was locked on 2026-04-11 (see `04-replication-plan.md` §"V1 scope decisions"):

| Locked decision | Impact on this design |
|---|---|
| No payment integration | Direct booking creates a `bookings` row with `status=pending_guide_confirm`. Guide confirms with one click. No money moves. ✓ |
| No deposits | No PII gate via deposit. Meeting point + guide contacts unlock on `status=confirmed`. ✓ |
| Bid-first workflow | Биржа-mode (request → bid → accept) remains the canonical multi-quote path. Трипстер-mode is the parity path for "I already chose this tour, just book it". ✓ |
| No cancellation | Bookings only progress forward. Stale `pending_guide_confirm` rows accumulate; managed via admin tool out of scope. Acceptable for soft launch volume. ✓ |
| 0% commission | No commission math anywhere. Direct-booking and bid-derived bookings both record `amount_minor` only. ✓ |

Tripster's own `travelers-booking-mfe` (research file 03 §3) hosts both the paid booking AND the free pre-booking inquiry flow under the same form, with tabs "Заказать" / "Задать вопрос". Provodnik's `BookingFormTabs.tsx` mirrors this exactly. We are doing UX alignment that was always marked P0 ("Inquiry-vs-booking dual path | Already present as requests + offers | Small — UX alignment | P0 (map it)" — research file 04 §"Feature matrix" row 11).

## Goals

- Listing-detail pages own **Трипстер-mode** unambiguously: clicking the primary CTA creates a direct booking against that specific listing, no bidding.
- Request creation owns **Биржа-mode** unambiguously: open request → multiple guides bid.
- A first-time visitor on the home page can self-select which mode they want before clicking anything.
- Guide side surfaces the two booking origins distinctly: direct bookings land in `/guide/orders` (Заказы) with "Подтвердить заказ"; bid requests land in `/guide/inbox` (Входящие) with "Предложить цену".
- No schema migrations. No payment integration. No new tables. Use what exists.

## Non-goals

- Payment integration (locked out per 2026-04-11; 0% commission stays).
- Cancellation, refund, deposit flows.
- Removing the bidding flow — it remains the canonical path for "Я хочу что-то особенное" requests and for the group-formation MVP feature (PRD §11).
- Renaming or migrating database tables/columns.
- Changing how messaging threads work.
- Group-join feature build-out (covered separately in NEXT_PLAN, not this batch).

---

## Design

### Core architectural primitive: route-owned mode

The mode is a property of the **path that creates the booking**, not a property of the booking row.

| Mode | Entry path | Wizard/form | Backend artifact |
|---|---|---|---|
| **Трипстер-mode** | `/listings/[slug]` → "Заказать" → `/listings/[id]/book` | `BookingFormTabs` | `bookings` row, `status=pending_guide_confirm`, `request_id=NULL`, `listing_id` populated, `amount_minor` from listing |
| **Биржа-mode** | nav "Создать запрос" → `/traveler/requests/new` (3-step wizard) → `/requests/[id]` (open) → guide bids → traveler accepts | request wizard + BidFormPanel | `traveler_requests` + `guide_offers` rows; on accept, `bookings` row with `status=confirmed`, `request_id` populated, `amount_minor` from offer |

Both modes terminate in the same `bookings` and `threads` tables. The discriminator is `request_id IS NULL`.

### User entry point inventory

| Entry | Mode | Notes |
|---|---|---|
| Home → "Готовый тур" card → `/listings` | Трипстер | New section, step 8 |
| Home → "Свой запрос" card → `/traveler/requests/new` | Биржа | Same section |
| Top nav (logged-in) "Туры" → `/listings` | Трипстер | existing |
| Top nav (logged-in) "Создать запрос" → `/traveler/requests/new` | Биржа | existing |
| `/listings/[slug]` listing detail "Заказать" CTA | Трипстер | existing for Tour, **fix for Excursion** |
| `/listings/[slug]` listing detail "Задать вопрос" tab in book form | Трипстер (inquiry sub-mode) | message thread, no booking row created |
| `/guides/[id]` guide profile "Хочу гида X" → `/traveler/requests/new?guide=[id]` | Биржа | preserved — legitimate "I want this specific guide to propose something" intent |
| Destination page `/destinations/[slug]` listing card click | Трипстер | existing, depends on listing detail wiring |
| `/requests` open-requests feed | Биржа | guide-side discovery |

### Code change plan (cross-references plan file task IDs)

**Task 1 — `features/listings/components/ExcursionShapeDetail.tsx:103`** (single-line CTA route swap; standalone PR; ~30 min)
- Before: `href={\`/traveler/requests/new?guide=${guide.id}\`}` with text "Запросить у этого гида".
- After: `href={\`/listings/${listing.id}/book\`}` with text "Заказать".
- Match `TourShapeDetail.tsx:96` exactly.
- Verification: click CTA on `/listings/moscow-boulevards-and-hidden-yards`, land on `/listings/[id]/book` not `/traveler/requests/new`.

**Task 2 — Guide /guide/orders direct-booking branch** (R1 mitigation; ~1.5 hours)
- Inspect `app/(protected)/guide/orders/**` queries and render path.
- When a booking row has `request_id IS NULL` and `listing_id IS NOT NULL`, render the Заказы card with:
  - Listing title (from `listing_id`)
  - Traveler name + dates + party size
  - Price = `listing.price_minor` (since no bid existed)
  - Single CTA: "Подтвердить заказ" → server action → `bookings.status='confirmed'`
- For request-derived bookings (`request_id IS NOT NULL`), keep existing rendering.
- Verification: query the orders list with both row shapes; both render without errors.

**Task 3 — `features/booking/components/BookingFormTabs.tsx` shape-agnostic verify + amount_minor smoke check** (R2/R4; ~1.5 hours)
- Confirm the form accepts excursion-shape listing data without runtime errors.
- If excursion-shape lacks fields the form expects (`duration_minutes`, `meeting_point_text`), add fallback rendering — do not throw.
- The two tabs ("Заказать" / "Задать вопрос") are mode-agnostic, no changes there.
- Verify `createBookingFromListing` server action multiplies/divides minor units correctly. Add a smoke test that reads back the booking row and asserts `amount_minor === listing.price_minor`.
- For listings with multiple `listing_tariffs` rows: use the cheapest tariff (`MIN(price_minor)`) for v1. Multi-tariff selection in the form is post-launch.
- Verification: book an excursion-shape listing, read back the booking row, assert amount equals listing price.

**Task 4 — `app/(public)/listings/[id]/book/page.tsx` shape guard removal** (~30 min)
- If `getListingById()` query has shape filter rejecting excursions, remove it.
- Verify the page loads cleanly for both shape values.

**Task 5 — Reject listings without `price_minor` at publish validation** (Q3 answer; ~30 min)
- In the listing-publish server action, validate `price_minor IS NOT NULL AND > 0` before allowing `status='published'`.
- Existing listings with NULL price get marked `status='draft'` via one-off SQL run by orchestrator (not in this batch's commit).
- Verification: attempt to publish a listing with NULL price; receive validation error.

**Task 6 — W-04: budget minor-units fix + per-person toggle in wizard** (~3 hours, P1 from morning audit)
- Same minor-units family as Task 3. `app/(protected)/traveler/requests/new/actions.ts:80` likely missing `* 100` for minor units.
- Add per-person/total toggle to wizard step 3 (budget step). Default: per-person.
- Update `getOpenRequests()` budget label to use the chosen interpretation.
- Verification: create request with budget 5000₽ per-person, party 2; guide inbox displays "5 000 ₽ с человека" not "100 ₽ с человека".

**Task 7 — W-02: full-card Link wrap on guide listing card** (~30 min, P1)
- `features/guide/components/listings/guide-listing-card.tsx:83` — wrap full card in `<Link>`, not just title.
- Verification: click anywhere on card → navigate to listing edit page.

**Task 8 — W-01: hoist "Предложить цену" CTA above fold in guide inbox** (~1 hour, P1)
- `features/guide/components/requests/guide-requests-inbox-screen.tsx` — add primary CTA on the card row that scrolls to / expands BidFormPanel. Currently only "Подробнее" is visible.
- Verification: as guide, see "Предложить цену" CTA on the card row of every open request without scrolling.

**Task 9 — W-03: dashboard "от X ₽" → `formatRub(budget) / чел.`** (~30 min, P2)
- `features/traveler/components/traveler-dashboard-screen.tsx:177,204` — replace `от ${budget * 0.8} ₽` with `${formatRub(budget)} / чел.` (or `за группу` based on per-person flag from Task 6).
- Verification: dashboard cards show concrete budget label, not the vague `от X ₽`.

**Task 10 — Home-page "Two ways to book" section** (~1.5 hours, P2)
- `app/(home)/page.tsx` — add 2-column section above the fold or right below the hero:
  - Left card: "Готовый тур" → "Выберите готовый тур у гида и забронируйте напрямую" → `/listings`
  - Right card: "Свой запрос" → "Опишите, что хотите — гиды предложат вам варианты с ценой" → `/traveler/requests/new`
- Copy draft to be reviewed by Alex on Slack before deploy (Q2 answer).
- Verification: visit `/` (logged-out), see the two cards. Click each → land on correct path.

### What stays unchanged

- 3-step request wizard at `/traveler/requests/new`
- `BidFormPanel` inline in `/guide/inbox` cards
- Schema, RLS, server actions, payment absence, 0% commission
- "Хочу гида X" CTA from public guide profile (`/guides/[id]`) — keeps `?guide=[id]` param into wizard as a legitimate Биржа-mode entry from a guide's profile (different intent: "I want THIS guide to propose something custom")
- Group-join feature on existing open requests (not built out here; tracked separately)

### Data flow

**Трипстер-mode happy path:**

```
traveler /listings → /listings/moscow-boulevards-and-hidden-yards
    → "Заказать" → /listings/[id]/book
    → BookingFormTabs (Заказать tab) → server action: createBookingFromListing
    → bookings row: { listing_id, traveler_id, guide_id,
                      status: 'pending_guide_confirm',
                      request_id: NULL,
                      amount_minor: listing.price_minor }
    → notification to guide (Telegram + in-app)
    → guide /guide/orders shows new card → "Подтвердить заказ"
    → server action: confirmBooking → status='confirmed'
    → traveler sees /traveler/bookings/[id] with confirmed ticket
```

**Трипстер-mode inquiry sub-flow (no booking row):**

```
traveler /listings/[slug] → /listings/[id]/book → "Задать вопрос" tab
    → message form → server action: createInquiryThread
    → thread row: { subject_type: 'listing', subject_id: listing.id,
                    traveler_id, guide_id }
    → guide /messages shows new thread → reply
    → traveler sees reply in /messages
    → optional: traveler returns to /listings/[id]/book → "Заказать" tab → books
```

**Биржа-mode happy path (unchanged):**

```
traveler nav "Создать запрос" → /traveler/requests/new (3-step wizard)
    → server action: createOpenRequest
    → traveler_requests row, status='open'
    → guides see in /guide/inbox → BidFormPanel → submit offer
    → guide_offers row
    → traveler /requests/[id] → "Принять" → server action: acceptOffer
    → bookings row: { request_id, listing_id (from offer.listing_id or NULL),
                      status: 'confirmed', amount_minor: offer.amount_minor }
    → traveler /traveler/requests/[id]/accepted (emotional moment page)
```

### Error handling

- **Excursion-shape listing missing `meeting_point_text` or `duration_minutes`**: BookingFormTabs renders fallback rows; server action validates only date / party_size / contact. Don't block direct booking on optional metadata.
- **Listing has no `price_minor`** (legacy seed data): blocked at publish-validation (Task 5). Existing NULL-price listings get marked draft pre-deploy.
- **Multi-tariff listing**: use cheapest tariff for v1 booking amount. Tariff selection UI is post-launch.
- **Guide does not confirm in N days**: pending booking sits indefinitely (no cancel per scope). Admin-tool sweeper out of scope. Acceptable for soft launch volume.
- **Direct booking arrives during guide's existing event slot**: no overlap detection in v1. Guide reviews calendar manually before confirming.

### Testing — manual QA walkthrough on staging

1. Logged-in traveler opens `/listings/moscow-boulevards-and-hidden-yards`. Clicks primary CTA. Lands on `/listings/[id]/book` with BookingFormTabs visible. Submits "Заказать" tab. Sees confirmation. Booking appears in `/traveler/bookings`.
2. Logged-in guide (the listing owner) opens `/guide/orders`. Sees the new direct booking. Clicks "Подтвердить заказ". Status changes. Traveler sees confirmed status.
3. Logged-in traveler opens `/traveler/requests/new`. Completes 3-step wizard. Request appears in `/requests`. Guide bids from `/guide/inbox` BidFormPanel. Traveler accepts. Booking created with `request_id` populated.
4. Anonymous visitor lands on home. Sees "Two ways to book" section. Clicks left card → `/listings`. Returns. Clicks right card → `/traveler/requests/new`.
5. Mobile: open the same listing on 375px width. Booking page renders responsively.
6. "Задать вопрос" sub-flow: traveler asks question, guide replies, traveler returns and books.
7. Edge: traveler with no party_size selected → form shows validation, does not submit.
8. Edge: listing with `price_minor=NULL` → publish action rejects, listing stays draft.

### Risks register

| ID | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | `/guide/orders` may currently assume every booking has `request_id`. Direct bookings (request_id=NULL) could render badly or 500. | High | Task 2 explicitly inspects + branches. Block deploy until verified. |
| R2 | `listing.price_minor` may not populate `booking.amount_minor` correctly on direct-book path. Yesterday's W-04 budget bug shows minor-unit math is fragile in this codebase. | High | Task 3 includes a smoke test reading back the row. |
| R3 | Home-page "Two ways to book" copy needs Alex sign-off; wrong copy = relabeling churn. | Medium | Draft in PR description; ping Alex on Slack before deploying step 10. |
| R4 | Excursion-shape listings may have a different field schema than Tour-shape, breaking BookingFormTabs at runtime. | Medium | Task 3 adds defensive fallbacks; QA step 1 catches at staging. |
| R5 | Mobile responsiveness of booking page on excursion shape (untested previously). | Low | QA step 5 covers; should be CSS-only fix if needed. |
| R6 | Pending direct bookings accumulate forever (no cancel flow). | Low | Acceptable at soft-launch volume; admin sweeper post-launch. |
| R7 | Guide may not want direct-booking on a particular listing (prefers all-bid). | Low | Out of scope; opt-out flag deferred. Document in soft-launch FAQ. |

---

## Out of scope (next sprint or later)

- Payment rail (YooKassa / Tinkoff / CloudPayments)
- Cancellation policy + refund flow
- Per-listing direct-booking opt-out flag
- Multi-tariff selection UI in BookingFormTabs (currently uses cheapest)
- Tour/Excursion shape file consolidation (defer until both stable)
- Reviews on direct bookings (verify path still works post-deploy)
- Stale-pending-booking sweeper

## Effort estimate

~10 working hours of focused work (10 tasks × 0.5–3h each). Fits inside 1.5 dev-day budget alongside W-01..W-04 polish.

## Success criteria

- Alex can reproduce the click path on `/listings/moscow-boulevards-and-hidden-yards` and reach the direct-booking form, not the request wizard.
- Alex confirms the home-page "Two ways to book" section reads correctly in plain Russian.
- A guide receiving a direct booking sees a clean Заказы card and can confirm with one click.
- Existing Биржа flow (request → bid → accept) continues to work end-to-end with zero regressions.
- All 9 tasks merged with `typecheck:0 lint:0` and Vercel green.

## Open questions resolved

| Q | Resolution |
|---|---|
| Q1 — payment scope | Locked out per 2026-04-11 decision. No change. |
| Q2 — home-page copy | Orchestrator drafts, Alex reviews on Slack before deploy of Task 10. |
| Q3 — missing `price_minor` fallback | No fallback to Биржа-mode. Reject at publish-validation (Task 5). Cleaner; surfaces the data gap. |
| Q4 — Tour/Excursion file consolidation | Defer to post-retest cleanup PR. Keeps this batch tight. |

## Dependencies

- All tasks depend on Vercel + Supabase being green (currently are; HEAD: `5cb821a`).
- Task 2 (orders branch) blocks Task 1 (CTA route swap) — Task 1 alone creates orphan rows guides can't see. Order in plan file reflects this.
- Task 6 (W-04 minor-units fix in wizard) is independent of the mode-split work. Can run parallel.
