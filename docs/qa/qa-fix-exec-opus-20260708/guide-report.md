# Guide role QA report — provodnik.app (production)

**Date:** 2026-07-08 (UTC)
**Account:** qa-guide@example.com (role: guide, verification_status: approved)
**Target:** https://provodnik.app
**Tooling:** Playwright (chromium, headless) driven via `bun run scripts/qa-guide-role-flow.mjs` plus three targeted follow-up scripts, all under `/private/tmp/provodnik-guide-availability-exec/scripts/` (source-reference workspace) / `/Users/idev/.claude/jobs/7b651ca6/tmp/`. Ground truth for `is_available` cross-checked directly against `guide_profiles` via the Supabase service role (read-only selects only; no writes outside the product's own toggle action).

## Scope

Full guide-role checklist per `/tmp/provodnik-role-qa-20260708/guide-task.md`: login/route-protection, dashboard, profile + availability toggle, pause/resume public effect, calendar, listings, inbox/open requests, offer submission, bookings, messages, console/network errors, mobile (375px).

## Routes tested

| Route | Result |
|---|---|
| `/guide` (unauthenticated) | ✅ Redirects to `/auth?next=%2Fguide` |
| `/auth?next=/guide` (login) | ✅ Logs in, redirects to `/guide/inbox` |
| `/guide` (authenticated) | ✅ Redirects to `/guide/inbox` (this route *is* the dashboard) |
| `/guide/profile` | ✅ Loads; availability toggle present |
| `/guide/calendar` | ✅ Loads; weekly schedule view, empty (no active listings) |
| `/guide/listings` | ✅ Loads; "Мои экскурсии", empty state + "Добавить экскурсию" CTA |
| `/guide/inbox` | ✅ Loads; "Новые: 0", "Мои отклики: 0", "Подтверждённые: 1" |
| `/guide/bookings` | ✅ Loads; 1 confirmed booking, 10 000 ₽ |
| `/guide/bookings/[bookingId]` | ✅ Loads; status "Подтверждена", contact-reveal card |
| `/guide/reviews` | ✅ Loads; empty state |
| `/guide/stats` | ✅ Loads; all-zero metrics (expected, no completed tours) |
| `/messages` | ✅ Loads; empty state (copy issue — see Issues) |
| `/guides` (public listing) | ✅ Used to verify availability pause/resume effect |

## Flows tested

1. **Route protection** — unauthenticated access to `/guide` correctly bounces to `/auth?next=...`. Confirmed with screenshot.
2. **Login/logout** — login succeeded and landed on `/guide/inbox`. Logout control was not found by accessible role/name search (`Выйти`/`Log out`/`Sign out`) within the header/nav in the automated pass — see Skipped areas; not confirmed as broken, just not located by the generic selector.
3. **Guide dashboard** — `/guide` is a pure redirect to `/guide/inbox`; there is no separate dashboard route. Working as designed.
4. **Profile editing surface** — profile page renders (About form, availability toggle, checklist, legal info, license manager, verification upload). Did not submit edits to About/legal fields to avoid mutating the QA fixture beyond the availability toggle (out of the stated test's primary target); the checklist and forms rendered without console/network errors.
5. **Availability toggle (self-service pause/resume) — core feature under test:**
   - Initial state: button read **"Приостановить приём заявок"** (available; click to pause).
   - Clicked → guide became unavailable. Confirmed via a *separate* navigation to the public `/guides` listing: **"QA Guide" no longer appeared** (`appearsInListing: false`).
   - Navigated back to `/guide/profile` fresh: button correctly read **"Возобновить приём заявок"** (paused; click to resume).
   - Clicked → guide became available again. Confirmed via `/guides`: **"QA Guide" reappeared** (`appearsInListing: true`).
   - **Ground truth cross-check** against `guide_profiles.is_available` via Supabase service role after the full run: `is_available: true` — matches the intended end state, and the public listing / toggle both agreed with it in a fresh, isolated session (see Issues #1 for a caveat observed mid-run).
6. **Calendar / working-days** — `/guide/calendar` shows a weekly slot schedule tied to *active excursion listings*; since the QA guide has zero listings, every day correctly shows "Нет событий." No separate "working days" control exists outside the main availability toggle and per-listing scheduling — this matches the codebase (`src/lib/supabase/availability.ts` only exposes guide-level `is_available`, no day-of-week granularity).
7. **Listings** — `/guide/listings` shows the expected empty state ("Экскурсий пока нет") with a "Добавить экскурсию" CTA. Did not create a listing (see Skipped areas / offer submission below for why this wasn't necessary to unblock).
8. **Inbox / open requests** — `/guide/inbox` correctly shows 0 new requests, 0 responses, 1 confirmed. No traveler requests were open in the QA environment at test time.
9. **Offer submission** — **blocked, not a defect.** No open traveler request existed to respond to (inbox confirmed 0 new). Creating a synthetic open request would require a *traveler*-role account and action, which is outside this guide-scoped account and task; per the task's own safety constraints (QA-only data, minimal footprint) the safer choice was to document the blocker rather than fabricate cross-role state. Creating a guide listing alone would not have unblocked this, since the gating resource is the traveler request, not the guide's listing. Recommend a coordinated run where the traveler-role QA pass creates a `ROLEQA-20260708-traveler-*` request first, then this guide flow re-runs step 9 against it.
10. **Bookings** — 1 pre-existing confirmed booking (10 000 ₽) was visible and its detail page opened without errors. Detail page showed "Завершить / Отменить / Неявка" action buttons (not exercised, to avoid mutating a booking outside this account's own test-created data) and a contact-reveal card.
11. **Messages** — `/messages` loads cleanly with an empty-state card. See Issues #2 for a copy defect.
12. **Console/network errors** — see below.
13. **Mobile (375px)** — `/guide/profile` and `/guide/inbox` both rendered without layout breakage at 375×812. Screenshots captured.

## Booking/approval coverage

- Guide-side view of an already-confirmed booking was exercised (detail page, action buttons present per state machine: complete/cancel/no-show).
- Did **not** exercise the confirm/complete/cancel/no-show transitions themselves, since the only booking present was pre-existing (not QA-created by this run) and mutating its state would leave production data in an altered state outside this task's authority. Flagged in Skipped areas.
- Did **not** exercise a full request → offer → accept → booking cycle end-to-end, because no open traveler request existed (see flow #9).

## Issues found

| # | Severity | Category | Where | Steps | Expected | Actual | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | Low | UI consistency (unconfirmed/flaky) | `/guide/profile` availability toggle | Toggle availability twice in one long-lived browser session interleaved with ~10 other page navigations, then reload `/guide/profile` | Toggle label matches current `is_available` state | Label briefly showed "Возобновить приём заявок" (implying paused) once even though DB `is_available` was `true` and the public `/guides` listing correctly showed the guide as available | `guide-screens/20-final-profile-state.png`; `guide-flow-log.json` step `final-availability-check` |
| 2 | Low | Copy/content (confirmed) | `/messages` empty state | Log in as a **guide** with no conversations, visit `/messages` | Role-appropriate empty-state copy | Copy reads "Здесь появятся переписки **с гидами**" ("chats with guides will appear here") and CTA "Найти тур" (traveler action) — both are traveler-oriented text shown to a guide | `guide-screens/24-messages-page.png`; source: `src/features/messaging/components/conversation-list.tsx:69-73` (hardcoded, no role branch) |

**Follow-up on Issue #1:** re-tested twice in isolation — (a) a brand-new browser context + fresh login immediately after the main run showed the *correct* label matching DB state, and (b) a second isolated single-toggle test also showed the correct label after a full page reload. Response headers on `/guide/profile` are correctly `cache-control: private, no-cache, no-store, max-age=0, must-revalidate` with `x-vercel-cache: MISS` on every request — this is **not** an HTTP/CDN caching bug. Most likely a client-side render race after many rapid consecutive navigations in one session rather than a persistent data-correctness bug. Backend state (`guide_profiles.is_available`) and the public `/guides` listing were correct at every checkpoint. Recommend engineering add a Playwright regression test that toggles + rapidly navigates across guide routes and asserts the toggle label on return, since this is exactly the kind of race a guide could hit in real usage (multiple tabs, quick nav clicks).

One non-issue investigated and ruled out: the booking detail page showed "Контакт появится после подтверждения" (phone will appear after confirmation) for the QA Traveler contact card even though the booking status was "Подтверждена" (confirmed). Traced to `booking-detail-screen.tsx:837-861` — the reveal condition (`contactRevealed`) had already correctly triggered (the card rendered); the fallback text only appears because `record.travelerPhone` is empty on this specific QA Traveler fixture account, not because of a logic defect.

## Console/network errors

- **Console errors/warnings:** none observed across all 21 scripted steps.
- **Uncaught page errors:** none observed.
- **HTTP 4xx/5xx responses:** none observed.
- **Network events captured:** 68, all `net::ERR_ABORTED` on `requestfailed`, all attributable to benign Next.js prefetch cancellations (`?_rsc=...` segment prefetches aborted by the next navigation) and analytics/RUM beacons (`/cdn-cgi/rum`, `/monitoring`) aborted on page unload. These are expected artifacts of rapid scripted navigation, not product defects — full list in `guide-flow-log.json`.

## Skipped / unreachable areas

- **Logout control** — not located via generic accessible-name search (`Выйти` / `Log out` / `Sign out`); likely lives inside a menu/dropdown not expanded by the script. Not confirmed broken — recommend a follow-up with an explicit nav-menu-open step.
- **Profile field edits** (About form, legal info, license manager, verification upload) — rendered without errors but form submissions were not exercised, to keep the QA footprint minimal on a shared fixture account.
- **Full request → offer → accept → booking cycle** — blocked by no open traveler request in the environment at test time (see flow #9). Requires a coordinated traveler-role QA pass.
- **Booking status transitions** (Завершить / Отменить / Неявка) — visible but not exercised, since the only booking present was pre-existing, not created by this run.
- **Listing creation** ("Добавить экскурсию") — not exercised; not needed to unblock any other checklist item, and creating a public listing has real footprint on production (visible on `/guides` search) for no additional coverage gained this run.
- **Contact-visibility settings** (`/guide/settings/contact-visibility`, present in the route map) — not in the guide-task checklist scope, not visited.

## Recommendations

1. **Fix `/messages` empty-state copy** to branch on role (guide vs. traveler) — currently hardcoded traveler-oriented text (`src/features/messaging/components/conversation-list.tsx:69-73`). Small, low-risk fix.
2. **Add a regression test** for the availability toggle label staying correct after rapid multi-route navigation in one session (see Issue #1) — cheap insurance even though this run couldn't reproduce it in isolation.
3. **Coordinate a cross-role QA pass**: have the traveler-role QA script create a `ROLEQA-20260708-traveler-*` request, then re-run this guide flow's offer-submission step against it to get real coverage of request → offer → accept → booking.
4. **Add an explicit "open nav menu" step** to any future automated guide QA script so logout and any menu-only controls get exercised and screenshotted.
5. No changes needed to the core availability pause/resume feature itself — it correctly gates public visibility in both directions and persisted correctly end-to-end.

## Final state confirmation

`qa-guide@example.com` (`guide_profiles.user_id = 904cdd5c-aa53-4d61-9986-65b9340b66b1`) is restored to `is_available: true`, `verification_status: approved` — verified via direct read-only Supabase query after all test steps completed, matching the task's safety requirement to leave the fixture account available.

## Artifacts

- Flow log / structured events: `/tmp/provodnik-role-qa-20260708/guide-flow-log.json`
- Screenshots (24 files, desktop 1440px + mobile 375px): `/tmp/provodnik-role-qa-20260708/guide-screens/`
- Driver scripts (source-reference workspace, not committed): `scripts/qa-guide-role-flow.mjs` under `/private/tmp/provodnik-guide-availability-exec/`
