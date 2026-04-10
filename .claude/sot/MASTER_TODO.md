# PROVODNIK — MASTER TODO & DELIVERY PLAN
_Generated: 2026-04-10 | Owner: Orchestrator | Source: Alex Excel v1 + Full Codebase Audit_

---

## HOW TO READ THIS DOCUMENT

Every item has:
- **Source** — where the issue was found (Alex Excel sheet/row, or Audit)
- **Status** — current state
- **Exact files** — what the coder must touch
- **Acceptance criteria** — how to verify it's done
- **Priority** — P0 (launch blocker) → P3 (roadmap)

Priority definitions:
- **P0** — App cannot go live with this broken. Fix first.
- **P1** — Must be fixed before soft launch. High user-impact.
- **P2** — Fix within first 2 weeks post-launch.
- **P3** — Roadmap / v2. Log and defer.

Status definitions:
- `DONE` — implemented in prior session. **Must be re-verified and re-implemented by coder AI.**
- `BUG` — confirmed broken, traced to root cause
- `MISSING` — feature not built at all
- `PARTIAL` — code exists but incomplete/broken
- `RESEARCH` — needs decision before coding

---

## TIER P0 — LAUNCH BLOCKERS
_These must be resolved before any real user touches the app._

---

### P0-001 — Request creation form does not save to DB
**Source:** Alex Sheet 1 #3, Sheet 2 #1
**Status:** BUG — CRITICAL
**Root cause:** Two completely separate `/requests/new` routes exist:
- `/app/(site)/requests/new/` → renders `CreateRequestScreen` (unknown if it saves)
- `/app/(protected)/traveler/requests/new/` → renders `TravelerRequestCreateScreen` (confirmed saves via `createRequestAction`)

The homepage CTA and guide profile "Связаться с гидом" button both link to the PUBLIC route `/requests/new`. The public route's `CreateRequestScreen` component has not been confirmed to write to Supabase. This is the exact bug Alex reported — users fill the form, submit, nothing appears in their dashboard.

**Files to fix:**
- `src/app/(site)/requests/new/page.tsx`
- `src/features/requests/components/create-request-screen.tsx` — READ THIS FIRST, trace whether it calls a server action that actually inserts
- `src/data/traveler-request/submit.ts` — confirmed returns `{ status: "local" }`, never writes to DB. If `CreateRequestScreen` calls this, that's the bug.
- **Fix option A:** Rewrite `CreateRequestScreen` to use the same `createRequestAction` as the protected route
- **Fix option B:** Redirect `/requests/new` to `/traveler/requests/new` (requires auth, handles redirect after login)
- Recommended: Option B — single source of truth for form logic

**Acceptance criteria:**
- Unauthenticated user visits `/requests/new` → redirected to `/auth` with `redirectTo=/requests/new`
- After login, user lands back on form
- User fills form and submits → request appears in `/traveler/requests` dashboard
- No request goes into "local" state — every submission hits Supabase

---

### P0-002 — Booking never transitions from `pending` to `confirmed`
**Source:** Codebase Audit
**Status:** BUG — CRITICAL
**Root cause:** The state machine `pending → confirmed` transition exists in `lib/bookings/state-machine.ts` but NO UI calls it. The guide has no button to confirm a booking. The traveler has no mechanism to confirm. Every booking stays `pending` forever. The review button only appears on `completed` bookings. The dispute button only appears on `confirmed` bookings. So users can never leave a review and never open a dispute.

**Files to fix:**
- `src/app/(protected)/guide/bookings/[bookingId]/page.tsx` — add "Подтвердить бронирование" button
- Create `src/app/(protected)/guide/bookings/[bookingId]/actions.ts` — server action `confirmBookingAction` that calls `transitionBooking(bookingId, "confirmed")` after verifying guide ownership
- `src/features/guide/components/bookings/guide-booking-detail-screen.tsx` — render the confirm button when `status === "pending"`
- Also wire: booking status labels in traveler view must update reactively (currently shows "Бронирование создано" regardless of status — hardcoded heading in `traveler/bookings/[bookingId]/page.tsx`)

**Acceptance criteria:**
- Guide sees booking with status "pending" → sees "Подтвердить бронирование" button
- Guide clicks → booking transitions to "confirmed" in DB
- Traveler's booking detail updates to show "confirmed" status
- Traveler can now see "Открыть спор" button (was gated on confirmed)
- Admin can mark booking "completed" from dispute resolution, which unlocks review

---

### P0-003 — Payment button is a broken stub
**Source:** Codebase Audit
**Status:** PARTIAL — misleading UX
**Root cause:** `TravelerBookingDetailScreen` renders a `disabled` button "Оплатить предоплату (демо)". Users will click it and nothing happens. This destroys trust on first contact.

**Files to fix:**
- `src/features/traveler/components/bookings/traveler-booking-detail-screen.tsx`
- **Remove** the disabled payment button entirely
- **Replace** with an info block: "Оплата организуется менеджером. После подтверждения бронирования с вами свяжутся."
- Do NOT implement payment integration — out of P0 scope. Just remove the broken affordance.

**Acceptance criteria:**
- No disabled button visible on booking detail
- Clear text explanation of payment process shown instead
- `deposit_minor` and `remainder_minor` fields in DB can stay empty for now

---

### P0-004 — Mobile navigation is completely missing
**Source:** Codebase Audit (site-header.tsx)
**Status:** MISSING
**Root cause:** `site-header.tsx` hides all nav links with `max-md:hidden`. There is no hamburger menu, no drawer, no mobile nav. Mobile users see only the logo and action buttons — they cannot navigate to /listings, /requests, /destinations, /guides.

**Files to fix:**
- `src/components/shared/site-header.tsx`
- Add a hamburger button (visible only on mobile, `md:hidden`)
- Add a mobile drawer/sheet (`Sheet` from shadcn/ui) containing all nav links
- Mobile nav must also show: Dashboard link if authenticated, Messages link, Sign out

**Acceptance criteria:**
- On viewport < 768px: hamburger icon visible in header
- Tap hamburger → drawer opens with all 4 nav links + auth CTAs
- All nav links are tappable and navigate correctly
- Drawer closes after navigation
- Guide CTA on mobile: "Смотреть запросы"; traveler/guest: "Создать запрос"

---

### P0-005 — Guide can join traveler groups and create traveler requests (access control)
**Source:** Alex Sheet 3 #1
**Status:** BUG — CRITICAL
**Root cause:** No role-based access control guards the "join group" flow or the request creation form. A guide logging in with `role: "guide"` can access `/traveler/requests/new` and join open requests meant for travelers.

**Files to fix:**
- `src/app/(protected)/traveler/requests/new/page.tsx` — add `requireRole("traveler")` guard; if user is guide, redirect to `/guide/dashboard` with toast "Гиды не могут создавать запросы путешественника"
- `src/features/traveler/components/open-requests/traveler-open-request-detail-screen.tsx` — hide "Присоединиться к группе" button if current user role is `guide`
- `src/app/(protected)/traveler/` — consider adding a layout-level role guard that redirects guides to their dashboard
- `src/data/open-requests/supabase-client.ts` → `joinOpenRequestInSupabase()` — add server-side role check before upsert

**Acceptance criteria:**
- Guide visits `/traveler/requests/new` → redirected to `/guide/dashboard`
- Guide views an open request → "Присоединиться к группе" button not rendered
- If guide somehow calls `joinOpenRequestInSupabase()` directly → server rejects with error
- Traveler access is unaffected

---

## TIER P1 — PRE-LAUNCH MUST
_Fix before soft launch. High user impact._

---

### P1-001 — "Связаться с гидом" routing (DONE — re-verify + confirm working)
**Source:** Alex Sheet 1 #8
**Status:** DONE — needs re-verification
**What was done:** Button in `guide-profile-screen.tsx` now links to `/requests/new?guide={guide.slug}`.
**What to verify:**
- Does `CreateRequestScreen` (public route) actually read the `?guide=` param and pre-fill or attach to the request?
- If not, the fix is cosmetic — the param is ignored
**Files to verify:**
- `src/features/requests/components/create-request-screen.tsx` — does it read `searchParams.guide`?
- If not: add logic to read the param, show guide name in form, and store `guide_id` or `guide_slug` on the created request

**Acceptance criteria:**
- User visits `/guide/aleksey-sokolov`
- Clicks "Связаться с гидом"
- Lands on `/requests/new?guide=aleksey-sokolov`
- Form shows "Запрос адресован: Алексей Соколов" or similar
- Submitted request is associated with that guide in DB

---

### P1-002 — "Стать гидом" CTA hidden for authenticated guides (DONE — re-verify)
**Source:** Alex Sheet 1 #9, Sheet 3 #8
**Status:** DONE — needs re-verification
**What was done:** `/guides/page.tsx` checks `auth.role !== "guide"` before rendering the CTA section.
**Files to verify:**
- `src/app/(site)/guides/page.tsx` — confirm auth check is present and correct
- Check if the CTA also appears anywhere else (homepage, footer) that was not fixed

**Acceptance criteria:**
- Logged-in guide visits `/guides` → no "Стать гидом" CTA section visible
- Logged-in traveler or guest → CTA is visible
- Run as `guide@provodnik.test` to verify

---

### P1-003 — "Как это работает" removed from nav + footer (DONE — re-verify)
**Source:** Alex Sheet 4 #1
**Status:** DONE — needs re-verification
**Files to verify:**
- `src/components/shared/site-header.tsx` — confirm `navLinks` array has no "Как это работает"
- `src/components/shared/site-footer.tsx` — confirm `projectLinks` has no "Как это работает"

**Acceptance criteria:**
- Neither main nav nor footer О проекте section contains "Как это работает"
- `/#hiw` section still exists on homepage (the anchor section itself stays — only the nav link is removed)

---

### P1-004 — Footer link fixes (DONE — re-verify)
**Source:** Alex Sheet 2 #15 (duplicate "Условия использования"), Cookies link bug
**Status:** DONE — needs re-verification
**Files to verify:**
- `src/components/shared/site-footer.tsx`
- Confirm `supportLinks` does NOT contain "Условия использования"
- Confirm `policyLinks` Cookies href is `/policies/cookies` not `/policies/privacy`
- Confirm `/policies/cookies` page exists and loads without 404

**Acceptance criteria:**
- Footer Поддержка column: "Доверие и безопасность" + "Связаться с нами" only
- Footer Политики column: all 3 links load correctly (terms, privacy, cookies)
- Cookies page shows content (not 404)

---

### P1-005 — Policy pages container layout (DONE — re-verify)
**Source:** Alex Sheet 2 #3, #8, #9, #14
**Status:** DONE — needs re-verification
**Files to verify:**
- `src/app/(site)/policies/layout.tsx` — exists with `max-w-[860px]` container
- `src/app/(site)/trust/page.tsx` — has `pt-[110px]` + container wrapper
- Visit `/policies/terms`, `/policies/privacy`, `/policies/cancellation`, `/policies/refunds`, `/policies/cookies` and `/trust` — none should have text touching the edges

**Acceptance criteria:**
- All 6 pages: content is centered, max 860px wide, with horizontal padding
- Text never touches viewport edges on desktop or mobile

---

### P1-006 — Guide avatar photos corrected (DONE — re-verify)
**Source:** Alex Sheet 2 #20
**Status:** DONE — needs re-verification
**Files to verify:**
- `supabase/migrations/20260401000002_seed.sql`
- Elena Voronina: female photo URL
- Maksim Korolev: male photo URL
- Maria Grechko: female photo URL, different from other female guides

**Acceptance criteria:**
- After `bun run db:reset`, all 3 guides show correct-gender photos
- No two guides share the same Unsplash photo ID

---

### P1-007 — Guide profile stats alignment (DONE — re-verify)
**Source:** Alex Sheet 2 #20
**Status:** DONE — needs re-verification
**Files to verify:**
- `src/features/guide/components/public/guide-profile-screen.tsx`
- The 3 stat numbers (рейтинг, поездок, лет опыта) must use `font-sans tabular-nums`

**Acceptance criteria:**
- Rating/trips/years numbers are numerically aligned (tabular-nums)
- Numbers use font-sans, not font-display
- Numbers don't shift when value changes (e.g. 4.9 vs 5.0)

---

### P1-008 — Photo upload to tour is broken
**Source:** Alex Sheet 3 #4
**Status:** BUG — CONFIRMED
**Root cause:** Unknown — needs investigation. The listing create/edit form has an image upload section, but the audit suggests it may not be saving to Supabase Storage or updating the `image_url` column on the listing.

**Files to investigate:**
- `src/app/(protected)/guide/listings/new/page.tsx`
- `src/app/(protected)/guide/listings/[id]/edit/page.tsx`
- `src/app/(protected)/guide/listings/actions.ts` — trace the upload flow
- `src/data/supabase/queries.ts` — does `createListing` or `updateListing` handle image_url?

**Fix:**
- If upload exists but doesn't persist: fix the server action to upload to Supabase Storage bucket and store the public URL in `listings.image_url`
- If upload UI is missing: add `<input type="file" accept="image/*">` to listing form with client-side preview and server action handling

**Acceptance criteria:**
- Guide creates/edits a listing and uploads a photo
- Photo is saved to Supabase Storage
- `listings.image_url` column is populated
- Listing card on `/guide/listings` and public `/listings/[slug]` shows the uploaded photo, not a fallback

---

### P1-009 — "Запросы" / "Смотреть запросы" duplicated in guide nav
**Source:** Alex Sheet 3 #6
**Status:** PENDING
**Root cause:** Guide navigation has two entries that both lead to the requests section.

**Files to fix:**
- Find the guide sidebar/nav component — likely `src/components/shared/workspace-role-nav.tsx` or a guide-specific nav
- Remove the duplicate. Keep one entry labeled "Запросы" → `/guide/requests`

**Acceptance criteria:**
- Guide dashboard sidebar/nav has exactly ONE "Запросы" link
- No duplicate or near-duplicate navigation items

---

### P1-010 — Homepage process section alignment (DONE — re-verify)
**Source:** Alex Sheet 2 image comment (icon/number alignment)
**Status:** DONE — needs re-verification
**Files to verify:**
- `src/features/homepage/components/homepage-process.tsx`
- Icon and step number should be side-by-side, not stacked or misaligned

**Acceptance criteria:**
- 3 cards are equal height
- Each card: icon circle + step number on same row
- Title and description below that row
- Dashed connector between cards (desktop), hidden on mobile

---

### P1-011 — "Купить тур" / direct booking CTA on listing detail
**Source:** Alex Sheet 1 #1
**Status:** MISSING
**Root cause:** Listing detail page (`/listings/[slug]`) only shows "Создать запрос" and "Найти группу". There is no direct "book this tour" flow.

**Files to fix:**
- `src/app/(site)/listings/[slug]/page.tsx`
- Add prominent "Записаться / Забронировать тур" primary button in the sidebar above "Создать запрос"
- For MVP: this button links to `/requests/new?listing={slug}&guide={guide.slug}` (pre-fills the request form with this specific tour + guide)
- Add a note: "Гид получит ваш запрос и предложит дату и состав группы"
- Do NOT implement full real-time booking without payment — that's v2

**Acceptance criteria:**
- Listing detail shows "Забронировать тур" as the primary CTA (above "Создать запрос")
- Click navigates to request form pre-filled with the tour/guide context
- Request form shows "Вы запрашиваете: [Tour Title]"

---

### P1-012 — Listing detail content bugs
**Source:** Codebase Audit
**Status:** BUG
**Multiple bugs in `src/app/(site)/listings/[slug]/page.tsx`:**
1. "Что включено" right column is hardcoded exclusions ("Авиа и ж/д билеты / Личные расходы / Страховка") but the card title says "Что включено" — wrong label or wrong content. Split into two sections: "Включено" and "Не включено".
2. `durationDays` is silently clamped to `Math.min(3, Math.max(1, l.durationDays))` — any tour longer than 3 days shows wrong duration. Remove the clamp.
3. Itinerary always has exactly 1 item regardless of actual tour length — the data mapping creates `[{ title, description, durationHours }]`. Need to check if `listings` table has a proper `itinerary` JSON column; if not, remove the fake multi-day UI.

**Files to fix:**
- `src/app/(site)/listings/[slug]/page.tsx` — fix the three issues above
- `src/data/supabase/queries.ts` — check if `itinerary` column exists on `listings`

**Acceptance criteria:**
- "Что включено" shows only inclusions (from `listing.inclusions`)
- "Что не включено" is a separate block showing exclusions
- Duration shows actual days without artificial cap
- Itinerary section is removed OR correctly shows actual multi-day breakdown

---

### P1-013 — Destination page: `openRequestCount` shows guide count
**Source:** Codebase Audit
**Status:** BUG
**Root cause:** In `destinations/[slug]/page.tsx`, field mapping:
```ts
openRequestCount: d.guidesCount,
```
The count is wrong — it shows number of guides, not open requests.

**Files to fix:**
- `src/app/(site)/destinations/[slug]/page.tsx`
- Either: fetch actual open request count for this destination from DB
- Or: remove the field from the UI if it cannot be accurately computed

**Acceptance criteria:**
- If shown, `openRequestCount` reflects actual open traveler requests for that destination
- If data is unavailable, the field is not displayed (don't show 0 or wrong count)

---

### P1-014 — Traveler booking detail: hardcoded "Бронирование создано" heading
**Source:** Codebase Audit
**Status:** BUG
**Root cause:** `src/app/(protected)/traveler/bookings/[bookingId]/page.tsx` always shows "Бронирование создано" regardless of booking status.

**Files to fix:**
- `src/app/(protected)/traveler/bookings/[bookingId]/page.tsx`
- Map status → heading:
  - `pending` → "Бронирование ожидает подтверждения"
  - `confirmed` → "Бронирование подтверждено"
  - `completed` → "Поездка завершена"
  - `cancelled` → "Бронирование отменено"
  - `disputed` → "Открыт спор по бронированию"

**Acceptance criteria:**
- Heading on booking detail reflects actual current status
- Status badge and heading are consistent

---

### P1-015 — Guide verification stepper is static (always shows step 2)
**Source:** Codebase Audit
**Status:** BUG
**Root cause:** `guide-dashboard-screen.tsx` shows a 3-step verification progress stepper hardcoded to step 2 ("На проверке") active. A rejected guide sees the same UI as a pending guide.

**Files to fix:**
- `src/features/guide/components/dashboard/guide-dashboard-screen.tsx`
- Accept `verificationStatus: "pending" | "approved" | "rejected" | "changes_requested"` as prop
- Render stepper state dynamically:
  - `pending` → step 2 active
  - `approved` → step 3 active, show "Профиль одобрен" in green
  - `rejected` → show rejection state with "Заявка отклонена. Проверьте комментарий администратора." and link to re-submit
  - `changes_requested` → show "Требуются изменения" with admin note
- `src/app/(protected)/guide/dashboard/page.tsx` — pass actual `verificationStatus` from DB

**Acceptance criteria:**
- Rejected guide sees rejection message and link to re-submit
- Approved guide sees "Профиль одобрен"
- Pending guide sees "На проверке"
- Changes requested: guide sees the admin's note

---

### P1-016 — Provodnik logo button works intermittently
**Source:** Alex Sheet 2 #16
**Status:** BUG — needs investigation
**Root cause:** Unknown. Could be Next.js `<Link>` hydration issue, or a client-side navigation conflict.

**Files to investigate:**
- `src/components/shared/site-header.tsx` — find the logo `<Link>` element
- Check: is it a `<Link href="/">` or an `<a>` tag?
- Check: any onClick handlers on it that might interfere?
- Check: does the issue happen on mobile specifically or all viewports?

**Fix:**
- Ensure logo is wrapped in `<Link href="/" prefetch={false}>` (remove prefetch to avoid hydration issues)
- Ensure no parent `<div onClick>` is capturing the click

**Acceptance criteria:**
- Logo click navigates to `/` on every tap/click, consistently
- Works on mobile and desktop
- Works in both logged-in and logged-out states

---

## TIER P2 — PRE-LAUNCH POLISH
_Fix before or immediately after soft launch._

---

### P2-001 — Join group → no dashboard reflection or notifications
**Source:** Alex Sheet 1 #4
**Status:** PARTIAL
**Root cause:** The join action writes to `open_request_members` in DB, but the traveler's main dashboard does not show "groups you've joined." No notification is sent to the group organizer when someone joins.

**Files to fix:**
- `src/app/(protected)/traveler/dashboard/page.tsx` (or equivalent) — add a "Группы, в которых вы участвуете" section showing joined requests
- `src/data/open-requests/supabase-client.ts` → `joinOpenRequestInSupabase()` — after successful join, call `createNotification()` for the request organizer: "Кто-то присоединился к вашей группе"
- `src/features/traveler/components/open-requests/traveler-open-request-detail-screen.tsx` — after joining, show confirmation state (currently unknown)

**Acceptance criteria:**
- Traveler joins a group → sees it listed in their dashboard
- Organizer receives an in-app notification when someone joins
- Open request detail shows updated member count reactively after join
- "Выйти из группы" button also removes from dashboard list

---

### P2-002 — Search and filters on /listings
**Source:** Alex Sheet 1 #2
**Status:** MISSING
**Files to build:**
- `src/features/listings/components/listings-filter-bar.tsx` — filter by: destination, price range, duration, group type (private/group)
- `src/app/(site)/listings/page.tsx` — read filter query params, pass to listing query
- `src/data/supabase/queries.ts` → `getListings()` — add filter parameters to the Supabase query

**Acceptance criteria:**
- User can filter /listings by destination city
- User can filter by price range (from/to in ₽)
- User can filter by duration (1 day, 2-3 days, 4+ days)
- Filters are reflected in URL params (shareable/bookmarkable)
- Filter bar is visible on mobile

---

### P2-003 — Date picker UX for manual entry
**Source:** Alex Sheet 1 #5
**Status:** PENDING
**Root cause:** Current date pickers may not support typing a date manually — only calendar selection.

**Files to fix:**
- `src/features/traveler/components/request-create/traveler-request-create-form.tsx`
- Ensure both `startDate` and `endDate` fields accept typed input (dd.mm.yyyy format)
- Add field validation: end date must be after start date; start date must be in the future

**Acceptance criteria:**
- User can type "25.07.2026" into date field and it parses correctly
- Calendar picker still works as alternative
- Validation error if end < start
- Validation error if start is in the past

---

### P2-004 — Search on /destinations
**Source:** Alex Sheet 1 #6
**Status:** MISSING
**Files to build:**
- `src/app/(site)/destinations/page.tsx` — add search input at top of page
- Filter destinations client-side by name (if small list) or via Supabase `ilike` query
- URL param `?q=` for shareable search state

**Acceptance criteria:**
- Destinations page has a text search input
- Typing "байкал" filters the grid to show only matching destinations
- Empty state: "По запросу «...» ничего не найдено"

---

### P2-005 — Search guides by name
**Source:** Alex Sheet 3 #9
**Status:** MISSING
**Files to build:**
- `src/app/(site)/guides/page.tsx` — add search input
- `src/data/supabase/queries.ts` → `getGuides()` — add `?q=` filter using `display_name ilike %query%`

**Acceptance criteria:**
- Guides page has search input
- Typing a name filters guide cards
- URL param `?q=` is used (shareable)

---

### P2-006 — Guide offer form is under-specified
**Source:** Codebase Audit + Product Vision
**Status:** PARTIAL
**Root cause:** The offer form only captures 3 fields: price, message, expiry. The `guide-offer/schema.ts` has richer fields (inclusions, timing summary, capacity) that are never shown. `capacity` is hardcoded to 1.

**Files to fix:**
- `src/features/guide/components/offer/offer-form-client.tsx` — add fields:
  - `capacity` (number): max participants the guide is offering for
  - `inclusions` (multiline or list): what's included in the offer
  - `timing_summary` (text): brief itinerary or daily schedule
- `src/app/(protected)/guide/requests/[requestId]/offer/actions.ts` → `submitOfferAction` — read and save these fields
- DB: confirm `guide_offers` table has columns for these fields; if not, add migration

**Acceptance criteria:**
- Guide offer form has: price total, capacity, inclusions, timing summary, message, expiry date
- All fields saved to DB
- Traveler sees these fields on the offer detail view
- Computed "price per person" = price_total / capacity (shown in real-time as guide types)

---

### P2-007 — Destination page: purpose and button routing unclear
**Source:** Alex Sheet 1 #7
**Status:** NEEDS DESIGN DECISION
**Root cause:** Destination detail page exists but the primary CTA is unclear. What should happen when a user clicks a button on the Kazan destination page? "Book a tour in Kazan"? "Create a request for Kazan"? "Browse tours in Kazan"?

**Recommended approach:**
- Primary CTA: "Смотреть туры в [Destination]" → `/listings?destination={slug}` (requires P2-002 filter to work)
- Secondary CTA: "Создать запрос" → `/requests/new?destination={destination.name}`
- The destination page becomes a discovery hub, not a dead end

**Files to fix:**
- `src/features/destinations/components/destination-detail-screen.tsx`
- Update CTAs per above

**Acceptance criteria:**
- Destination page has clear primary and secondary CTAs
- "Смотреть туры" links to /listings filtered by this destination
- "Создать запрос" pre-fills destination name in request form

---

### P2-008 — Email notifications for key events
**Source:** Product Vision Doc + Audit (no push/email exists)
**Status:** MISSING
**Root cause:** Zero email integration. Guides will miss incoming requests if they're not actively on the site.

**Files to build:**
- Install `resend` npm package (or similar)
- `src/lib/email/send-email.ts` — wrapper around Resend API
- `src/lib/email/templates/new-offer.tsx` — guide notified of new request matching their region
- `src/lib/email/templates/booking-created.tsx` — guide notified when traveler books
- `src/lib/email/templates/booking-confirmed.tsx` — traveler notified when guide confirms
- Wire into existing notification triggers in `lib/notifications/`

**Priority events for email (MVP):**
1. Guide receives a new offer response from traveler
2. Guide's booking is created (traveler accepted offer)
3. Traveler's booking is confirmed by guide

**Acceptance criteria:**
- guide@provodnik.test receives an email when a traveler accepts their offer
- Email contains booking details and link to `/guide/bookings/{id}`
- Emails are not sent in development (NODE_ENV check)

---

### P2-009 — Heading font: soften or reconsider
**Source:** Alex Sheet 2 #13
**Status:** DESIGN DECISION PENDING
**Root cause:** Alex commented that `font-display` (the decorative serif used for all `h1`/`h2` headings) looks "too sharp/aggressive."

**Options:**
- A: Keep font-display but reduce weight (currently `font-semibold` → try `font-normal`)
- B: Switch section headers to font-sans with tight tracking
- C: Keep as-is — this is a brand decision, not a bug

**Recommended: Option A** — reduce heading weight to `font-medium` across all `font-display` headings and review visually.

**Files to fix (if proceeding):**
- `src/features/homepage/components/homepage-hero.tsx`
- `src/features/homepage/components/homepage-process.tsx`
- `src/features/guide/components/public/guide-profile-screen.tsx`
- Any other component using `font-display font-semibold` for large headings

**Acceptance criteria:**
- Headings feel refined, not aggressive
- Brand identity is preserved (still serif, just lighter weight)
- All heading sizes remain consistent

---

### P2-010 — Admin: review moderation UI
**Source:** Codebase Audit + Product Vision
**Status:** MISSING
**Root cause:** Reviews publish immediately. Admin has no page to view, hide, or moderate reviews.

**Files to build:**
- `src/app/(protected)/admin/reviews/page.tsx` — list all reviews with status (published/hidden)
- `src/app/(protected)/admin/reviews/[reviewId]/page.tsx` — detail with "Скрыть отзыв" / "Восстановить" buttons
- Server actions: `hideReview`, `restoreReview` that update `reviews.status`

**Acceptance criteria:**
- Admin can see all published reviews in a list
- Admin can hide a review → it disappears from public guide profile
- Admin can restore a hidden review
- Review count on guide profile does not count hidden reviews

---

## TIER P3 — ROADMAP / V2

---

### P3-001 — Off-platform contact prevention
**Source:** Product Vision Doc (risk: "увод сделки за пределы площадки")
**Status:** MISSING
**What to build (v2):**
- Regex detection of phone numbers, Telegram handles, email addresses in chat messages
- When detected: show warning "Обмен контактами до бронирования нарушает правила площадки"
- Log flagged messages for admin review (don't block, just flag)

---

### P3-002 — Full payment integration (YooKassa or Stripe)
**Source:** Product Vision Doc
**Status:** MISSING
**What to build (v2):**
- Payment provider integration
- Deposit capture at booking creation
- Remainder at trip completion
- Refund flow tied to cancellation rules

---

### P3-003 — Туры vs Экскурсии terminology decision
**Source:** Alex Sheet 3 #3
**Status:** RESEARCH NEEDED
**Action:** Compare Tripster and GetYourGuide terminology. Propose consistent usage across all UI copy. Туры = multi-day trips. Экскурсии = day trips / city tours? Requires PM decision before implementation.

---

### P3-004 — Push notifications (PWA or native)
**Source:** Product Vision Doc
**Status:** MISSING
**What to build (v2):**
- FCM web push notifications
- Service worker registration
- Push for: new request matching guide's region, booking confirmed, new message

---

### P3-005 — Review pre-moderation queue
**Source:** Product Vision Doc
**Status:** MISSING
**What to build (v2):**
- Reviews enter `pending_moderation` state instead of publishing immediately
- Admin approves/rejects before visible on guide profile
- Auto-approve after 48h if no admin action

---

### P3-006 — Richer group joining experience
**Source:** Alex Sheet 1 #4
**Status:** PARTIAL (P2-001 handles dashboard; this is the full UX)
**What to build (v2):**
- Group chat thread for all members of an open request
- Real-time member roster on request detail
- Organizer can approve/reject join requests

---

## MASTER CHECKLIST SUMMARY

| ID | Area | Priority | Status |
|---|---|---|---|
| P0-001 | Request creation doesn't save to DB | P0 | 🔴 BUG |
| P0-002 | Booking never transitions from pending | P0 | 🔴 BUG |
| P0-003 | Payment button is a broken stub | P0 | 🔴 BUG |
| P0-004 | Mobile navigation is missing | P0 | 🔴 MISSING |
| P0-005 | Guide can join traveler groups | P0 | 🔴 BUG |
| P1-001 | "Связаться с гидом" routing | P1 | ✅ DONE — re-verify |
| P1-002 | "Стать гидом" hidden for guides | P1 | ✅ DONE — re-verify |
| P1-003 | "Как это работает" removed | P1 | ✅ DONE — re-verify |
| P1-004 | Footer link fixes | P1 | ✅ DONE — re-verify |
| P1-005 | Policy pages container | P1 | ✅ DONE — re-verify |
| P1-006 | Guide avatar photos | P1 | ✅ DONE — re-verify |
| P1-007 | Guide profile stats alignment | P1 | ✅ DONE — re-verify |
| P1-008 | Photo upload to tour broken | P1 | 🔴 BUG |
| P1-009 | "Запросы" duplication in guide nav | P1 | 🟡 PENDING |
| P1-010 | Homepage process section alignment | P1 | ✅ DONE — re-verify |
| P1-011 | "Купить тур" CTA on listing detail | P1 | 🟡 MISSING |
| P1-012 | Listing detail content bugs | P1 | 🔴 BUG |
| P1-013 | Destination openRequestCount wrong | P1 | 🔴 BUG |
| P1-014 | Booking heading hardcoded | P1 | 🔴 BUG |
| P1-015 | Guide verification stepper static | P1 | 🔴 BUG |
| P1-016 | Logo button intermittent | P1 | 🔴 BUG |
| P2-001 | Join group → no dashboard/notifications | P2 | 🟡 PARTIAL |
| P2-002 | Search + filters on /listings | P2 | 🟡 MISSING |
| P2-003 | Date picker manual entry | P2 | 🟡 PENDING |
| P2-004 | Search on /destinations | P2 | 🟡 MISSING |
| P2-005 | Search guides by name | P2 | 🟡 MISSING |
| P2-006 | Guide offer form under-specified | P2 | 🟡 PARTIAL |
| P2-007 | Destination page CTA routing | P2 | 🟡 PENDING |
| P2-008 | Email notifications | P2 | 🟡 MISSING |
| P2-009 | Heading font soften | P2 | 🟡 DESIGN |
| P2-010 | Admin review moderation UI | P2 | 🟡 MISSING |
| P3-001 | Off-platform contact prevention | P3 | 📋 ROADMAP |
| P3-002 | Payment integration | P3 | 📋 ROADMAP |
| P3-003 | Туры vs Экскурсии terminology | P3 | 📋 RESEARCH |
| P3-004 | Push notifications | P3 | 📋 ROADMAP |
| P3-005 | Review pre-moderation | P3 | 📋 ROADMAP |
| P3-006 | Richer group joining UX | P3 | 📋 ROADMAP |

---

## EXECUTION ORDER FOR CODER AI

Run in this exact order. Do not start a phase until previous phase is verified.

### PHASE 1 — Critical bugs (P0) — estimate: 1 session
1. P0-001: Fix request creation → single working flow
2. P0-005: Guide access control guards
3. P0-002: Booking confirmation button for guide
4. P0-003: Remove broken payment button
5. P0-004: Mobile hamburger navigation

### PHASE 2 — Done items re-verification + data bugs (P1 top) — estimate: 1 session
6. P1-001 through P1-007: Re-verify all DONE items
7. P1-013: Fix destination openRequestCount
8. P1-014: Fix booking heading
9. P1-015: Fix guide verification stepper
10. P1-012: Fix listing detail content bugs

### PHASE 3 — Feature completion (P1 remaining) — estimate: 1-2 sessions
11. P1-008: Photo upload fix
12. P1-009: Guide nav deduplication
13. P1-011: "Купить тур" CTA
14. P1-016: Logo button bug
15. P1-001: Verify guide slug pre-fills request form

### PHASE 4 — P2 features — estimate: 2-3 sessions
16. P2-001: Join group dashboard + notifications
17. P2-002: Listings search + filters
18. P2-004: Destinations search
19. P2-005: Guides search
20. P2-003: Date picker UX
21. P2-006: Richer offer form
22. P2-007: Destination CTAs
23. P2-008: Email notifications
24. P2-009: Heading font
25. P2-010: Admin review moderation

---

_This document is the single source of truth for remaining work. Update status column as items are completed._
