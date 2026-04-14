# QA Audit Findings — 2026-04-14

## Scope

Full pre-launch QA audit of `provodnik.app`. Covered all public routes anonymously, then
an authenticated end-to-end workflow with 4 test users completing the full
request → bid → join → accept → confirm → ticket circle.

**Test users:**
| User | Email | Role |
|---|---|---|
| Maxim | maxim.guide@testprov.ru | guide |
| Anna | anna.traveler@testprov.ru | traveler (request owner) |
| Boris | boris.traveler@testprov.ru | traveler (group joiner) |
| Vera | vera.traveler@testprov.ru | traveler (group joiner) |

**Key IDs:**
- Anna's request: `602313fb-4187-47b3-8e5e-d80215ca4e15`
- Maxim's offer: `56399cbc-7ee1-4c82-9e05-060c7d291e93`
- Booking: `f10ae7de-41a7-4b14-9d2a-e5f9cd09bc8e`

---

## Bugs Fixed During Audit

### BUG-001 — P0: Traveler booking detail page crashes (FIXED)
**File:** `src/lib/supabase/bookings.ts`  
**Commit:** `0cd4bfe`  
**Root cause:** `getBooking()` used a single PostgREST join query
`guide_profile:guide_profiles!guide_id(...)` — but `bookings.guide_id` has a FK to
`profiles.id`, NOT to `guide_profiles.user_id`. No direct FK existed between
`bookings` and `guide_profiles`, so PostgREST threw a runtime error, which Next.js
caught and rendered the `(protected)/error.tsx` boundary ("СБОЙ КАБИНЕТА").  
**Fix:** Replaced the single complex join with three sequential `Promise.all` queries
(booking → guide_profile → traveler_request → guide_offer), each using valid FK paths.

### BUG-002 — P1: Guide inbox shows 0 open requests (FIXED)
**File:** `src/data/supabase/queries.ts`  
**Commit:** `765b662`  
**Root cause:** `getOpenRequests()` and `getRequestById()` both called `getPublicClient()`
internally, ignoring the `client` parameter. `getPublicClient()` requires
`SUPABASE_SECRET_KEY` (server-only env var, not available in browser), so the
call threw silently and returned `[]`.  
**Fix:** Changed `const db = getPublicClient()` → `const db = client` in both functions.

### BUG-003 — P1: Offer submission always shows generic error (FIXED)
**File:** `src/app/(protected)/guide/inbox/[requestId]/offer/actions.ts`  
**Commit:** `d837554`  
**Root cause:** Catch block used `err instanceof Error ? err.message : "..."` — but
`PostgrestError` from `@supabase/supabase-js` is NOT an `instanceof Error`. Any
DB-level error (RLS violation, constraint failure) always fell through to the
generic fallback string, hiding the real failure reason.  
**Fix:** Changed to check `typeof (err as any).message === 'string'` to extract the
message from any error-shaped object.

### BUG-004 — P2: English strings in request/booking UI (FIXED)
**Files:** multiple  
**Commit:** `d837554`  
**Instances:**
- `TravelerRequestStatusBadge` returned English labels ("Draft", "Submitted",
  "Offers received", "Booked", "Closed") → translated to Russian
- `traveler-request-detail-screen.tsx`: "No events yet." → "Событий пока нет."
- `mapRequestRow()` in `queries.ts`: `description` and `format` fields rendered raw
  enum values ("city", "group") as UI text → added `formatCategory()` and
  `formatFormatPreference()` helpers that return proper Russian labels

---

## Open Issues (Not Fixed)

### ISSUE-001 — P2: Traveler bookings list shows English status/currency
**Location:** `src/features/guide/components/bookings/guide-bookings-screen.tsx` and
corresponding traveler screen  
**Description:** Booking cards display raw DB values "PENDING" and "7 500 RUB"
instead of Russian equivalents. The `BookingRecord` type passes `status` as-is
without translation.

### ISSUE-002 — P2: Guide tour count shows 0 on public guide cards
**Location:** `/guides` listing page  
**Description:** Guide cards show tour count as 0. This is a data issue for test
users who have no published listings (Maxim's listing was draft-only during audit).
Behavior with real published listings needs verification.

### ISSUE-003 — P3: Guide booking detail flashes "Бронирование не найдено"
**Location:** `/guide/bookings/[id]` (client component)  
**Description:** Navigating directly to the URL (hard nav) shows the "not found"
empty state before the async data load completes. The loading skeleton
(`loading.tsx`) exists but the empty state renders too eagerly before `useEffect`
resolves. A `null | undefined` distinction in state initialization would fix this.

### ISSUE-004 — P3: Guide booking action summary shows English action name
**Location:** `src/features/guide/components/bookings/guide-booking-detail-screen.tsx`  
**Description:** After confirming a booking, the summary shows "Статус обновлён:
**confirm** → Подтверждена" — the action name "confirm" is English. Should be
"подтверждение" or omitted.

### ISSUE-005 — P3: No contact unlock flow for non-premium guides
**Location:** `/traveler/bookings/[id]`  
**Description:** Guide contact (phone) is null for test users. The
`contact_visibility_unlocked` flag on `guide_profiles` was not tested. The
contact card shows guide name and "Написать гиду" but no phone unlock flow was
exercised.

### ISSUE-006 — P3: Offer submit from bid form had RLS error during audit
**Description:** When Maxim attempted to submit a bid via the UI, the server action
returned a generic error. After BUG-003 fix, the real PostgrestError message will
now surface. The root RLS issue on `guide_offers` INSERT needs separate verification
after deploying BUG-003 fix.

---

## E2E Workflow Verification

| Step | Result |
|---|---|
| Anonymous: homepage, listings, guides, destinations, requests | All load, no crashes |
| Maxim registers as guide, onboards | Completed |
| Maxim creates listing (draft) | Completed |
| Anna registers as traveler | Completed |
| Anna creates request (Москва, 18-19 Apr, 3 people) | Completed |
| Boris joins Anna's group via public request page | Completed |
| Vera joins Anna's group via public request page | Completed |
| Maxim bids on Anna's request | Bid inserted via MCP (UI action had RLS error pre-fix) |
| Anna sees bid in "Предложения" tab, accepts | Completed — booking created |
| Maxim sees booking in `/guide/orders`, opens detail, confirms | Completed — DB status: confirmed |
| Anna opens `/traveler/bookings/[id]` — booking detail renders | Completed after BUG-001 fix |
| Anna clicks "Открыть билет" — ticket modal appears | Completed |

---

## Commits During Audit

| Hash | Description |
|---|---|
| `765b662` | fix(queries): use passed client in getOpenRequests/getRequestById |
| `0cd4bfe` | fix(bookings): split getBooking into sequential queries — no FK to guide_profiles |
| `d837554` | fix(i18n): replace English UI strings across request/booking flows + PostgrestError handling |
