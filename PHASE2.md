# Phase 2 Task Spec — Core Marketplace Loop

> Workspace: D:\dev\projects\provodnik\provodnik.app
> Read D:\dev\projects\provodnik\provodnik.app\AGENTS.md first.
> Then read the following before touching anything:
> - D:\dev\projects\provodnik\DESIGN.md
> - D:\dev\projects\provodnik\PLAN.md
> - C:\Users\x\.agents\skills\superpowers\dispatching-parallel-agents\SKILL.md
> - C:\Users\x\.agents\skills\superpowers\systematic-debugging\SKILL.md
> - C:\Users\x\.agents\skills\superpowers\verification-before-completion\SKILL.md

---

## PRE-TASK: Merge feat/phase1-run-b-v2 into main (BLOCKING — do this first)

The Phase 1 completion branch `feat/phase1-run-b-v2` has not been merged into `main`. It contains Phase 1 items 1.5–1.8 (guide onboarding, RLS audit, error boundaries, loading skeletons). Phase 2 must build on top of these.

Steps:
1. From `D:\dev\projects\provodnik\provodnik.app`, run: `git merge feat/phase1-run-b-v2`
2. There will be conflicts (22 known conflicts, all add/add except 3 content conflicts).
3. Resolve all conflicts:
   - **add/add on loading.tsx and error.tsx files**: Take the INCOMING (feat/phase1-run-b-v2) version. These are Phase 1 features we want.
   - **src/app/(site)/auth/page.tsx (modify/delete)**: File was deleted in main but modified in branch. Accept the branch version (keep the file — it was the wrong deletion).
   - **src/features/auth/components/auth-entry-screen.tsx**: Merge carefully — read both versions, combine intent. Branch version likely has role-based routing added. Keep both the main improvements AND the branch additions.
   - **src/lib/supabase/database.types.ts** and **src/lib/supabase/types.ts**: Read both versions. Branch adds RLS-related types. Merge both sets of types, no deletions.
   - **src/lib/auth/role-routing.ts**: Branch adds this file. Accept branch version.
4. After resolving: `bun run build` must pass. `bun run typecheck` must pass.
5. Commit the merge: `git commit -m "merge: complete Phase 1 (items 1.5-1.8) into main"`
6. **DO NOT push.**

Exit criterion: `main` branch builds clean with all Phase 1 features included.

---

## EXECUTION STRATEGY: Parallel Worktrees

After the PRE-TASK is complete, use the dispatching-parallel-agents approach with git worktrees for true isolation:

For each wave:
1. Create a worktree per agent group: `git worktree add ../worktrees/<name> -b <branch>`
2. Run `bun install` in each worktree's root
3. Dispatch agents to their worktrees in parallel
4. After all agents in a wave complete and build passes: merge each branch into main
5. Proceed to next wave

Worktree creation commands (run from `D:\dev\projects\provodnik\provodnik.app`):
```bash
# Wave 1
git worktree add ../worktrees/phase2-feat001 -b phase2/feat001
git worktree add ../worktrees/phase2-state-machine -b phase2/state-machine
git worktree add ../worktrees/phase2-guide-listings -b phase2/guide-listings

# Wave 2 (after Wave 1 merged)
git worktree add ../worktrees/phase2-request-create -b phase2/request-create
git worktree add ../worktrees/phase2-offer-form -b phase2/offer-form

# Wave 3 (after Wave 2 merged)
git worktree add ../worktrees/phase2-group-pricing -b phase2/group-pricing
git worktree add ../worktrees/phase2-booking-loop -b phase2/booking-loop
```

After each wave completes: merge branches, remove worktrees:
```bash
git merge phase2/<branch-name> --no-edit
git worktree remove ../worktrees/phase2-<name>
git branch -d phase2/<name>
```

---

## WAVE 1 — Fully Independent (3 agents in parallel)

### Agent 1A — FEAT-001: Hide "Войти" from nav when logged in
**Worktree:** `../worktrees/phase2-feat001`
**Workspace:** `D:\dev\projects\provodnik\worktrees\phase2-feat001`

Read these files first:
- `src/components/shared/site-header.tsx`
- `src/lib/auth/server-auth.ts`
- `src/lib/auth/types.ts`
- `src/app/layout.tsx` (find where SiteHeader is rendered)

Task:
- SiteHeader is "use client" (uses usePathname). Add optional `isAuthenticated?: boolean` prop.
- Find ALL places SiteHeader is rendered. In each parent Server Component, call `readAuthContextFromServer()` and pass `isAuthenticated` down as a prop.
- In SiteHeader: render "Войти" only when `!isAuthenticated`.
- DO NOT use useEffect + client-side session check — that causes a flash. Server-side prop is required.
- "Создать запрос" always visible regardless of auth state.
- No new CSS. No per-component `<style>` blocks.

Acceptance: `bun run build` passes. `bun run typecheck` passes. Commit: `feat(nav): hide Войти link for authenticated users`

---

### Agent 1B — 2.5: Booking lifecycle state machine
**Worktree:** `../worktrees/phase2-state-machine`
**Workspace:** `D:\dev\projects\provodnik\worktrees\phase2-state-machine`

Read these files first:
- `src/lib/supabase/database.types.ts` (find bookings table schema)
- `src/lib/supabase/types.ts` (existing types)
- `src/app/globals.css` (to add status color tokens)

Create `src/lib/bookings/state-machine.ts`:
```typescript
// States
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'disputed'

// Valid transitions map
export const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'disputed'],
  completed: [],
  cancelled: [],
  disputed:  ['resolved', 'cancelled'],
}

export function canTransition(from: BookingStatus, to: BookingStatus): boolean
export async function transitionBooking(
  bookingId: string,
  to: BookingStatus,
  userId: string
): Promise<Booking>  // validates transition, updates Supabase row, returns updated booking
```

Create `src/components/bookings/booking-status-badge.tsx`:
- Display badge with status label in Russian: pending=Ожидает, confirmed=Подтверждено, completed=Завершено, cancelled=Отменено, disputed=Спор
- Colors via CSS custom properties only. Add to `globals.css` `:root` if not present:
  - `--success: #16a34a`
  - `--warning: #d97706`
- pending: `var(--on-surface-muted)` background tint
- confirmed: `var(--primary)` background tint
- completed: `var(--success)` background tint
- cancelled: neutral gray
- disputed: `var(--warning)` background tint

Acceptance: `bun run build` passes. `bun run typecheck` passes. Commit: `feat(bookings): add booking state machine and status badge`

---

### Agent 1C — 2.8: Guide listing CRUD
**Worktree:** `../worktrees/phase2-guide-listings`
**Workspace:** `D:\dev\projects\provodnik\worktrees\phase2-guide-listings`

Read these files first:
- `src/app/(protected)/guide/listings/` (check what scaffolding exists)
- `src/lib/supabase/database.types.ts` (find listings table schema)
- `src/lib/supabase/` (existing query patterns)
- `supabase/migrations/` (check listings table definition)
- DESIGN.md for layout and component patterns

Build complete guide listing CRUD:

**1. Listings list page** (`src/app/(protected)/guide/listings/page.tsx`):
- Fetch all listings for current guide via TanStack Query
- Display as card list: title, destination, price per person, status chip (draft/published/paused/pending_review), edit and pause/publish action buttons
- "Создать тур" primary CTA at top

**2. Create listing page** (`src/app/(protected)/guide/listings/new/page.tsx`):
- React Hook Form + Zod validation
- Fields: title (required), description (required), destination (required), price_per_person (number, required), max_group_size (number), duration_days (number), included (textarea), excluded (textarea)
- Skip photo upload — placeholder text "Фото можно добавить после публикации"
- Submit: server action that inserts into `listings` table with status='draft', guide_id from auth
- On success: redirect to `/guide/listings/[id]`
- On error: inline field errors

**3. Edit listing page** (`src/app/(protected)/guide/listings/[id]/edit/page.tsx`):
- Same form as create, pre-filled with existing data
- Submit: server action that updates the row (verify guide_id matches auth before update)

**4. Publish/Pause/Delete actions**:
- Publish: set status='pending_review' (requires admin approval per business rules, NOT 'published' directly)
- Pause: set status='paused'
- Delete: set `deleted_at = now()` (soft delete) — do NOT hard delete

**5. Listing detail page** (`src/app/(protected)/guide/listings/[id]/page.tsx`):
- Show all listing data
- Edit button, Publish/Pause button, Delete button

Design rules: follow DESIGN.md — glass cards, DM Sans UI, Cormorant for headings, no per-component `<style>` blocks, all styles via globals.css classes and CSS custom properties.

Acceptance: `bun run build` passes. `bun run typecheck` passes. Commit: `feat(guide): listing CRUD — create, edit, publish, pause, soft-delete`

---

## WAVE 2 — Data Foundation (2 agents in parallel, after Wave 1 merged)

### Agent 2A — 2.1: Request creation persists to Supabase
**Worktree:** `../worktrees/phase2-request-create`
**Workspace:** `D:\dev\projects\provodnik\worktrees\phase2-request-create`

Read these files first:
- `src/app/(protected)/traveler/requests/new/` (existing form)
- `src/lib/supabase/database.types.ts` (traveler_requests schema)
- `src/lib/supabase/` (existing query/mutation patterns)
- `supabase/migrations/` (find traveler_requests table definition)

The request creation form may already exist in the UI. Wire it to actually insert into Supabase.

Steps:
1. Check existing form component at `traveler/requests/new/`. If it only has UI, add submission logic.
2. Create `src/lib/supabase/requests.ts` with:
   - `createTravelerRequest(data: CreateRequestInput): Promise<TravelerRequest>` — Zod-validated, inserts to `traveler_requests`
   - `getTravelerRequest(id: string): Promise<TravelerRequest>` — fetch single request
   - `getTravelerRequests(travelerId: string): Promise<TravelerRequest[]>` — list for traveler
   - `getOpenRequests(): Promise<TravelerRequest[]>` — all open requests (for guide inbox)
3. Required fields in `CreateRequestInput` (check DB schema for exact column names): destination, date_start, date_end, group_size_min, group_size_max, budget_min, budget_max, description
4. traveler_id is always from server auth context — never from client input
5. On success: redirect to `/traveler/requests/[id]`
6. Show loading state during submission. Show inline errors on failure.
7. RLS check: after insert, verify the returning row is accessible to the inserting user. If not, there's an RLS gap — document it in a comment, do not change the policy.

Acceptance: Traveler creates a request → row in Supabase → redirects to detail page. `bun run build` + typecheck pass. Commit: `feat(traveler): wire request creation to Supabase`

---

### Agent 2B — 2.2: Guide offer form
**Worktree:** `../worktrees/phase2-offer-form`
**Workspace:** `D:\dev\projects\provodnik\worktrees\phase2-offer-form`

Read these files first:
- `src/app/(protected)/guide/` (find inbox or requests section)
- `src/lib/supabase/database.types.ts` (guide_offers schema)
- `src/lib/supabase/` (existing patterns)
- `supabase/migrations/` (find guide_offers table definition)

Create `src/lib/supabase/offers.ts` with:
- `createGuideOffer(data: CreateOfferInput): Promise<GuideOffer>`
- `getOffersForRequest(requestId: string): Promise<GuideOffer[]>`
- `getGuideOffers(guideId: string): Promise<GuideOffer[]>`
- `hasGuideOffered(guideId: string, requestId: string): Promise<boolean>`

**1. Guide inbox page** (`src/app/(protected)/guide/requests/page.tsx` or `guide/inbox/page.tsx` — check which exists):
- List of open `traveler_requests` (status='open') via TanStack Query using `getOpenRequests()` from requests.ts
- Show: destination, dates, budget range, group size, creator (first name only)
- Each row/card: "Предложить цену" button → navigates to `/guide/requests/[id]/offer`
- If guide already submitted an offer on a request: show "Предложение отправлено" chip instead

**2. Offer form page** (`src/app/(protected)/guide/requests/[id]/offer/page.tsx`):
- React Hook Form + Zod
- Fields: price_total (number, required), message (textarea, required), valid_until (date, default: today + 7 days)
- Display: price_per_person calculated field (price_total / request.group_size_min, read-only display)
- Guard: if guide already has an offer on this request → redirect to the request page with a toast
- Submit: call `createGuideOffer()` with guide_id from server auth, request_id from URL
- On success: redirect to `/guide/requests/[id]` with ?success=1

Design: single-column max-width 640px, glass inputs (border: `1px solid rgba(194,198,214,0.35)`, focus: `border-color: var(--primary)`), follows DESIGN.md. No per-component `<style>` blocks.

Acceptance: Guide sees open requests, submits an offer that persists. `bun run build` + typecheck pass. Commit: `feat(guide): offer form — view open requests and submit offers`

---

## WAVE 3 — Closing the Loop (2 agents in parallel, after Wave 2 merged)

### Agent 3A — 2.3 + 2.7: Accept offer → booking + confirmation page
**Worktree:** `../worktrees/phase2-booking-loop`
**Workspace:** `D:\dev\projects\provodnik\worktrees\phase2-booking-loop`

Read these files first:
- `src/app/(protected)/traveler/requests/[id]/page.tsx` (request detail)
- `src/lib/supabase/requests.ts` (from Wave 2 Agent 2A — now in main)
- `src/lib/supabase/offers.ts` (from Wave 2 Agent 2B — now in main)
- `src/lib/supabase/database.types.ts` (bookings schema)
- `src/lib/bookings/state-machine.ts` (from Wave 1 — now in main)
- `supabase/migrations/` (bookings table)

Create `src/lib/supabase/bookings.ts` with:
- `createBooking(data: CreateBookingInput): Promise<Booking>`
- `getBooking(id: string): Promise<Booking>` — with guide profile and request joined
- `getTravelerBookings(travelerId: string): Promise<Booking[]>`

**Task 2.3 — Accept offer on request detail**:

Update `src/app/(protected)/traveler/requests/[id]/page.tsx`:
1. Fetch all `guide_offers` for this request via `getOffersForRequest(requestId)`
2. Display offers as cards: guide name + avatar, price total, price per person, message preview, valid_until, "Принять" button
3. "Принять" button calls a server action that:
   a. Inserts into `bookings`: traveler_id (from auth), guide_id (from offer), request_id, offer_id, total_price (from offer), status='pending'
   b. Updates `traveler_requests.status = 'matched'`
   c. Updates all OTHER `guide_offers` for this request: status='rejected'
   d. Updates the accepted offer: status='accepted'
   e. Use a Supabase RPC function or sequential server actions. Prefer sequential with error rollback.
4. On success: redirect to `/traveler/bookings/[bookingId]`
5. Guard: only the request creator can accept offers on their own request (verify auth.userId === request.traveler_id)

**Task 2.7 — Booking confirmation page**:

Create `src/app/(protected)/traveler/bookings/[id]/page.tsx`:
- Fetch booking with guide profile and request data joined
- Layout (single column, max-width 640px, centered):
  1. "Бронирование создано" heading (Cormorant, large) — Note: not "confirmed" yet, status is 'pending'
  2. Guide card: avatar, name, verified badge (if guide_profiles.is_verified), contact info (phone, telegram handle from guide_profiles)
  3. Trip summary: destination, dates, group size, total price formatted as `X ₽`
  4. Muted note: "Итоговая стоимость и детали оговариваются с гидом напрямую"
  5. Guide contact card: "Свяжитесь с гидом: [phone] · Telegram: [@handle]"
  6. "Мои бронирования →" text link back to traveler dashboard
- Design: follows DESIGN.md. Glass cards, DM Sans UI, Cormorant headings. No per-component `<style>` blocks.

Acceptance: Full accept flow works — offer accepted, booking created, confirmation page renders with guide contact. `bun run build` + typecheck pass. Commit: `feat(traveler): accept offer → create booking → confirmation page`

---

### Agent 3B — 2.4 + 2.6: Group joining + price scenarios
**Worktree:** `../worktrees/phase2-group-pricing`
**Workspace:** `D:\dev\projects\provodnik\worktrees\phase2-group-pricing`

Read these files first:
- `src/app/(site)/requests/[requestId]/page.tsx` OR `src/app/(protected)/traveler/requests/[id]/page.tsx` — find where the public/traveler request detail lives
- `src/lib/supabase/requests.ts` (from Wave 2 — now in main)
- `src/lib/supabase/database.types.ts` (open_request_members schema)
- `supabase/migrations/` (find open_request_members table)

Create `src/lib/supabase/request-members.ts` with:
- `joinRequest(requestId: string, travelerId: string): Promise<void>`
- `getRequestMembers(requestId: string): Promise<RequestMember[]>`
- `isRequestMember(requestId: string, travelerId: string): Promise<boolean>`

**Task 2.4 — Group joining**:

On the request detail page (check both public and protected versions):
1. Show current member count and avatar stack (use existing `.avatar` + `.avatars` CSS classes from DESIGN.md)
2. "Присоединиться к группе" primary button — visible ONLY when:
   - request.status === 'open'
   - current user is NOT the request creator (request.traveler_id !== auth.userId)
   - current user is NOT already a member
   - request has not been matched
3. On join: call `joinRequest()` server action → insert into `open_request_members`
4. After join: revalidate page, show updated member count and avatar, hide "Присоединиться" button, show "Вы участник" chip

**Task 2.6 — Price scenarios display**:

On the same request detail page, add a pricing breakdown section below the request description:
- Section label: "СТОИМОСТЬ ГРУППЫ"
- Calculate and show per-person cost at different group sizes using the request's budget_min or budget_max (use budget_max for display)
- Show sizes from group_size_min to group_size_max, up to 5 data points
- Highlight the CURRENT group size (actual members count) column/row
- Simple table or horizontal card strip. Example:

```
1 чел.     2 чел.     3 чел.     4 чел.
30 000 ₽   15 000 ₽   10 000 ₽   7 500 ₽
```

- No new data fetching — use request data already on the page
- Use CSS custom properties for styling, no per-component `<style>` blocks
- Add `.price-scenarios` class to globals.css

Acceptance: Second traveler can join a request. Price table shows correct per-person costs. `bun run build` + typecheck pass. Commit: `feat(requests): group joining and price scenarios`

---

## GLOBAL CONSTRAINTS (apply to ALL agents)

- **All styles**: `globals.css` CSS custom properties only. No per-component `<style>` blocks. No Tailwind additions unless the file already uses Tailwind.
- **No inline styles** except for dynamic data (e.g., `style={{ width: '${pct}%' }}` for progress bars).
- **All mutations**: validate with Zod before Supabase insert/update.
- **All data fetching**: TanStack Query where pattern exists in the codebase. Server actions for mutations.
- **All forms**: React Hook Form + Zod.
- **RLS**: Do NOT change RLS policies. Work within them. If an insert fails due to RLS, document in a comment — do not patch the policy.
- **auth.userId**: Always from server auth context (`readAuthContextFromServer()` or equivalent). Never from client input.
- **Build gate**: `bun run build` AND `bun run typecheck` must pass before committing. Fix any TypeScript errors.
- **Do NOT push.** Commit only.
- **Commit message format**: `feat(<scope>): <what it does>`

## MERGE INSTRUCTIONS (after each wave)

After all agents in a wave complete:
```bash
# From D:\dev\projects\provodnik\provodnik.app
git merge phase2/<branch> --no-edit  # for each branch in the wave
git worktree remove ../worktrees/phase2-<name>
git branch -d phase2/<name>
bun run build  # verify merged state builds clean
```

If any merge has conflicts: prefer the incoming branch. Document any non-obvious resolution in the commit message.

## ACCEPTANCE CRITERIA FOR ALL OF PHASE 2

1. `bun run build` passes on `main` after all waves merged
2. `bun run typecheck` passes
3. Full loop is functional: traveler creates request → guide sends offer → traveler accepts → booking created → confirmation page shows guide contact
4. Guide can create/edit/publish listings
5. Group joining works: second traveler can join an open request
6. Price scenarios display correctly on request detail
7. "Войти" nav link hidden for logged-in users
8. Booking state machine enforces valid transitions
