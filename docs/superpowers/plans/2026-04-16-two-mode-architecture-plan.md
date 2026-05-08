# Implementation Plan — Two-Mode Architecture (Биржа + Трипстер)

**Date:** 2026-04-16
**Spec:** `docs/superpowers/specs/2026-04-16-two-mode-architecture-design.md`
**Audit source:** `.claude/logs/report-2026-04-16-alex-resolution.html`
**Client brief:** `.claude/logs/2026-04-16-plan-for-alex.html`
**SOT cursor:** `.claude/sot/NEXT_PLAN.md` (status block 2026-04-16 late)
**Target HEAD:** `5cb821a` on origin/main

---

## Phase strategy

One phase, ten tasks, two worktrees in parallel. Each task is sized to fit a single cursor-agent dispatch (≤ 8000 token prompt budget per CLAUDE.md §15).

- **Worktree A** (`.claude/worktrees/two-mode-arch`): Tasks 1–5 (mode-split surgery). Sequential within the worktree because Task 2 unblocks Task 1's safety.
- **Worktree B** (`.claude/worktrees/audit-polish`): Tasks 6–10 (W-01..W-04 polish + home section). Mostly independent; Task 6 is largest.

Both worktrees merge into main fast-forward only. Post-merge: full QA walkthrough on staging, then ping Alex for retest.

---

## Pre-flight checklist (orchestrator runs before any dispatch)

- [ ] Confirm spec at `docs/superpowers/specs/2026-04-16-two-mode-architecture-design.md` is approved.
- [ ] Confirm HEAD is clean: `git status` shows no uncommitted code in `provodnik.app/`.
- [ ] Confirm baseline: `bun run typecheck` and `bun run lint` both green.
- [ ] Read latest entries of `.claude/sot/ERRORS.md` (top 5) and `ANTI_PATTERNS.md` (top 5) — inline relevant entries into prompts.
- [ ] Read `.claude/sot/PATTERNS.md` for current Russian copy conventions and component patterns.
- [ ] Create both worktrees:
  - `git worktree add .claude/worktrees/two-mode-arch -b feat/two-mode-arch`
  - `git worktree add .claude/worktrees/audit-polish -b feat/audit-polish`
- [ ] Verify `cursor-dispatch.mjs` is functional with a 10-second smoke prompt.

---

## Task list

### Worktree A — mode-split surgery (sequential)

#### Task 1 — Excursion CTA route swap

**Branch:** `feat/two-mode-arch` (worktree A)
**File(s):** `provodnik.app/src/features/listings/components/ExcursionShapeDetail.tsx`
**Effort:** 30 min
**Depends on:** Task 2 (must merge first to avoid orphan-row rendering bugs)

**Cursor-agent prompt skeleton:**

> CONTEXT: Provodnik listing-detail pages have two shape components — TourShapeDetail and ExcursionShapeDetail. TourShape correctly routes its primary CTA to `/listings/[id]/book` (direct-booking, see line 96 of TourShapeDetail.tsx). ExcursionShape incorrectly routes to `/traveler/requests/new?guide=[id]` (bid marketplace), causing client complaint.
>
> SCOPE: change one CTA href + label in `provodnik.app/src/features/listings/components/ExcursionShapeDetail.tsx` around line 103. Match the TourShape pattern exactly. Do not touch any other component, file, or behaviour.
>
> KNOWLEDGE:
> - PATTERNS.md: Russian copy uses concrete imperatives. "Заказать" not "Забронировать".
> - ERRORS.md ERR-014 (W-04 family): minor-units math is fragile in this codebase — but irrelevant here, this task is pure routing.
> - ANTI_PATTERNS.md: never inline new server actions in shape components — only the href changes.
>
> TASK:
> 1. Read `provodnik.app/src/features/listings/components/TourShapeDetail.tsx` lines 80–110.
> 2. Read `provodnik.app/src/features/listings/components/ExcursionShapeDetail.tsx` lines 90–115.
> 3. Modify ExcursionShapeDetail line 103 area: change `href={\`/traveler/requests/new?guide=${guide.id}\`}` to `href={\`/listings/${listing.id}/book\`}`. Change visible text from "Запросить у этого гида" to "Заказать".
> 4. Verify TypeScript compile: `bun run typecheck`.
> 5. Commit: `[two-mode-arch] task-1: route excursion CTA to direct-book`.
>
> DONE CRITERIA: typecheck:0, lint:0, single-file diff, no new imports, no new actions.

**Verification (orchestrator):** open `/listings/moscow-boulevards-and-hidden-yards` on the worktree's preview deploy; click primary CTA; assert URL is `/listings/[id]/book` not `/traveler/requests/new`.

**Reviewer pass:** spec-compliance only. Single line change.

---

#### Task 2 — Guide /guide/orders direct-booking branch

**Branch:** `feat/two-mode-arch` (worktree A)
**File(s):** `provodnik.app/src/app/(protected)/guide/orders/**`, `provodnik.app/src/data/supabase/queries.ts` (function `getOrdersForGuide` or similar)
**Effort:** 1.5 hours
**Depends on:** none (must merge BEFORE Task 1)

**Cursor-agent prompt skeleton:**

> CONTEXT: Guide-side /guide/orders renders bookings. Currently every booking row in scope was created via Биржа-mode (request → offer → accept), so `request_id` is always populated and `listing_id` may or may not be. After Task 1 ships, direct-booking rows will arrive with `request_id=NULL` and `listing_id` populated. The render path must handle both shapes without crashing.
>
> SCOPE: inspect query + render of /guide/orders. Add a branch when `request_id IS NULL`: render listing title from `listing_id`, traveler info, party size, dates, price = `listing.price_minor`. Single CTA "Подтвердить заказ" → existing confirmBookingAction.
>
> KNOWLEDGE:
> - ERRORS.md ERR-001 (PostgREST joins): never use `guide_profiles!guide_id` style join — split into sequential queries.
> - PATTERNS.md: orders cards use the glass-card pattern; CTA on right side.
> - DECISIONS.md ADR-008: booking state machine has 7 DB states; only 5 are user-visible. `pending_guide_confirm` → `confirmed` is the relevant edge here.
>
> TASK:
> 1. Read `provodnik.app/src/app/(protected)/guide/orders/page.tsx` and child components.
> 2. Read the query in `provodnik.app/src/data/supabase/queries.ts` that backs the orders list.
> 3. Modify the query to return both row shapes; modify the card render to branch on `request_id IS NULL`.
> 4. Add unit-test-ish smoke check: render with mock data containing both row shapes, assert no exceptions.
> 5. Commit: `[two-mode-arch] task-2: render direct-booking orders in guide cabinet`.
>
> DONE CRITERIA: typecheck:0, lint:0, both row shapes render in /guide/orders without errors.

**Verification:** seed a test booking with `request_id=NULL` and `listing_id=<existing>`; load /guide/orders as that guide; confirm card renders + CTA works.

**Reviewer pass:** spec + code quality. Branch logic must not regress existing rendering.

---

#### Task 3 — BookingFormTabs shape-agnostic + amount_minor smoke check

**Branch:** `feat/two-mode-arch` (worktree A)
**File(s):** `provodnik.app/src/features/booking/components/BookingFormTabs.tsx`, `provodnik.app/src/app/(public)/listings/[id]/book/actions.ts` (or wherever createBookingFromListing lives)
**Effort:** 1.5 hours
**Depends on:** none

**Cursor-agent prompt skeleton:**

> CONTEXT: BookingFormTabs is currently used by Tour-shape listings only. After Task 1, it must render for Excursion-shape listings too. Excursion-shape data may lack `meeting_point_text`, `duration_minutes`, multi-day fields. Form must render fallbacks, not throw.
>
> Additionally: yesterday's W-04 audit found that `traveler_requests.budget_minor` math is fragile — `request-wizard.tsx:53` budgetMap stores integers but reads back / 100. The `createBookingFromListing` server action may have the same bug. Verify by reading back the booking row and asserting amount equals listing price.
>
> SCOPE: defensive fallback rendering in BookingFormTabs for missing fields; verify minor-units math in createBookingFromListing.
>
> KNOWLEDGE:
> - ERRORS.md ERR-014 family: minor-units bugs cluster around request-wizard and likely booking actions too.
> - PATTERNS.md: server actions return Result-shaped objects, not throw.
> - PATTERNS.md: use `formatRub(minor)` from `@/lib/format` for all ruble display.
>
> TASK:
> 1. Read `provodnik.app/src/features/booking/components/BookingFormTabs.tsx` end-to-end.
> 2. Read the createBookingFromListing server action.
> 3. Add fallback rendering: if `listing.meeting_point_text` is null, render "Место встречи: уточняется"; if `duration_minutes` is null, omit that row.
> 4. For multi-tariff listings (multiple `listing_tariffs` rows): use `MIN(price_minor)` for booking amount. Add comment explaining v1 limitation.
> 5. In createBookingFromListing: verify `amount_minor` is set to `listing.price_minor` directly (no division by 100). If currently buggy, fix it.
> 6. Add a smoke test (Vitest if present, else inline assertion in dev): create a booking from a listing with `price_minor=500000`, read back the row, assert `amount_minor === 500000`.
> 7. Commit: `[two-mode-arch] task-3: shape-agnostic booking form + amount smoke check`.
>
> DONE CRITERIA: typecheck:0, lint:0, smoke test passes, both Tour and Excursion listings render the form without runtime errors.

**Verification:** load `/listings/[excursion-id]/book`; confirm form renders. Submit. Read back the booking. Confirm amount.

**Reviewer pass:** spec + code quality. Must not change Tour-shape behaviour.

---

#### Task 4 — `/listings/[id]/book` shape guard removal

**Branch:** `feat/two-mode-arch` (worktree A)
**File(s):** `provodnik.app/src/app/(public)/listings/[id]/book/page.tsx`
**Effort:** 30 min
**Depends on:** none

**Cursor-agent prompt skeleton:**

> CONTEXT: `/listings/[id]/book/page.tsx` may currently filter or guard on `listing.shape === 'tour'`, rejecting excursion-shape. After Task 1, excursion CTAs route here; the guard must be removed.
>
> SCOPE: locate any shape filter or early-return in this page; remove it. Keep all other guards (auth, listing existence, etc).
>
> TASK:
> 1. Read the page end-to-end.
> 2. Find any check on listing.shape, listing.type, listing.kind that early-returns or 404s.
> 3. Remove only the shape-based check; keep auth + existence checks.
> 4. Commit: `[two-mode-arch] task-4: remove shape guard from book page`.
>
> DONE CRITERIA: typecheck:0, both Tour and Excursion listings load /listings/[id]/book successfully.

**Verification:** open `/listings/[excursion-id]/book` directly via URL; confirm 200 response, form renders.

---

#### Task 5 — Reject listings without `price_minor` at publish

**Branch:** `feat/two-mode-arch` (worktree A)
**File(s):** server action that publishes a listing (likely `provodnik.app/src/app/(protected)/guide/listings/[id]/edit/actions.ts` or similar)
**Effort:** 30 min
**Depends on:** none

**Cursor-agent prompt skeleton:**

> CONTEXT: Direct booking pulls amount from `listing.price_minor`. Listings with NULL price would create zero-amount bookings. Block at publish-validation.
>
> SCOPE: in the publish server action (transitions listing status from draft → published), add validation `price_minor IS NOT NULL AND price_minor > 0`. Return Russian error message: "Укажите цену тура перед публикацией".
>
> TASK:
> 1. Locate the publish action.
> 2. Add validation guard.
> 3. Verify the existing edit form surfaces server validation errors correctly.
> 4. Commit: `[two-mode-arch] task-5: validate price_minor at publish`.
>
> DONE CRITERIA: attempt to publish a draft listing with NULL price_minor → receive validation error, listing stays draft.

**Verification:** in admin/dev seed, create a listing with NULL price, try to publish via UI, expect error.

**Orchestrator post-task:** run a one-off SQL via Supabase Management API to mark any existing `status='published' AND price_minor IS NULL` listings as `status='draft'`. Document in METRICS.md.

---

### Worktree B — audit polish (mostly independent)

#### Task 6 — W-04 budget minor-units fix + per-person toggle

**Branch:** `feat/audit-polish` (worktree B)
**File(s):**
- `provodnik.app/src/features/requests/components/request-wizard.tsx` (line ~53 budgetMap)
- `provodnik.app/src/app/(protected)/traveler/requests/new/actions.ts` (line ~80 createOpenRequest)
- `provodnik.app/src/data/supabase/queries.ts` (line ~296 getOpenRequests budgetLabel)
- DB: no migration needed; `traveler_requests` has `budget_minor` already
**Effort:** 3 hours
**Depends on:** none

**Cursor-agent prompt skeleton:**

> CONTEXT: Yesterday's audit confirmed every open request shows "100 ₽ / чел." in guide inbox. Root cause: request-wizard stores integers (5000, 10000) in budget field; createOpenRequest action likely writes them as-is to `budget_minor` instead of multiplying by 100; getOpenRequests divides by 100 on read → renders 50, 100, 150 etc. Additionally: form has only "min budget" with no per-person/total clarity per Alex.
>
> SCOPE: fix the minor-units math AND add a per-person/total toggle to wizard step 3. Default toggle: per-person.
>
> KNOWLEDGE:
> - ERRORS.md ERR-014 (W-04 family): all minor-units bugs in this codebase trace to inconsistent multiplication.
> - PATTERNS.md: form fields use Zod schema validation; toggle is `<RadioGroup>` from shadcn.
> - DB column: `traveler_requests.budget_minor INTEGER NOT NULL` (kopecks). Add `budget_per_person BOOLEAN NOT NULL DEFAULT true` if missing — tiny additive migration.
>
> TASK:
> 1. Read request-wizard.tsx end-to-end.
> 2. Read createOpenRequest action and getOpenRequests query.
> 3. If `traveler_requests.budget_per_person` column doesn't exist: write migration `20260416000001_add_budget_per_person.sql` adding it.
> 4. Add toggle to wizard step 3: "Бюджет за человека" (default) / "Общий бюджет".
> 5. Fix createOpenRequest: write `budget_minor = budget_rubles * 100`.
> 6. Fix getOpenRequests budgetLabel: `${formatRub(budget_minor / 100)} ${per_person ? '/ чел.' : 'за группу'}`.
> 7. Commit: `[audit-polish] task-6: fix budget minor-units + per-person toggle`.
>
> DONE CRITERIA: typecheck:0, create request 5000₽/per-person/party=2, guide inbox shows "5 000 ₽ / чел.".

**Verification:** end-to-end manual on staging.

---

#### Task 7 — W-02 full-card Link wrap on guide listing card

**Branch:** `feat/audit-polish` (worktree B)
**File(s):** `provodnik.app/src/features/guide/components/listings/guide-listing-card.tsx`
**Effort:** 30 min
**Depends on:** none

**Cursor-agent prompt skeleton:**

> CONTEXT: Guide cabinet `/guide/listings` shows cards. Only the title is a `<Link>` (line 83), so clicking the body or image does nothing. Alex complaint W-02.
>
> SCOPE: wrap the entire card in `<Link>` to `/guide/listings/[id]/edit`. Preserve any nested action buttons (like "Опубликовать"/"Снять") with `onClick={(e) => e.stopPropagation()}` or by structuring as sibling.
>
> TASK:
> 1. Read the file.
> 2. Refactor: outer `<Link>` wraps the card; inner action buttons stop propagation.
> 3. Commit: `[audit-polish] task-7: full-card link on guide listing card`.
>
> DONE CRITERIA: clicking anywhere on a card body navigates to edit; clicking a nested button does its own action.

---

#### Task 8 — W-01 hoist "Предложить цену" CTA in guide inbox

**Branch:** `feat/audit-polish` (worktree B)
**File(s):** `provodnik.app/src/features/guide/components/requests/guide-requests-inbox-screen.tsx`
**Effort:** 1 hour
**Depends on:** none

**Cursor-agent prompt skeleton:**

> CONTEXT: BidFormPanel exists inline at line 414 of guide-requests-inbox-screen.tsx. Currently only "Подробнее" button is visible on the card row (lines 381, 398). Alex complaint W-01: guide thinks they can't bid because the bid panel is hidden below.
>
> SCOPE: add a primary CTA "Предложить цену" on every open-request card row. Clicking either scrolls to the BidFormPanel or expands it inline.
>
> TASK:
> 1. Read the screen file.
> 2. Add a primary button at card row level next to "Подробнее".
> 3. On click: scroll to or expand BidFormPanel for that row. If panel was hidden, show it.
> 4. Commit: `[audit-polish] task-8: hoist bid CTA in guide inbox`.
>
> DONE CRITERIA: guide opens /guide/inbox, sees "Предложить цену" on every open card row without scrolling.

---

#### Task 9 — W-03 dashboard budget label fix

**Branch:** `feat/audit-polish` (worktree B)
**File(s):** `provodnik.app/src/features/traveler/components/traveler-dashboard-screen.tsx` (lines 177, 204)
**Effort:** 30 min
**Depends on:** Task 6 (per_person flag must exist)

**Cursor-agent prompt skeleton:**

> CONTEXT: Traveler dashboard cards show `от ${budget * 0.8} ₽` — vague, no per-person label. Alex complaint W-03.
>
> SCOPE: replace with `${formatRub(budget_minor / 100)} ${per_person ? '/ чел.' : 'за группу'}`.
>
> TASK:
> 1. Read the screen file.
> 2. Replace lines 177, 204 with the concrete label.
> 3. Commit: `[audit-polish] task-9: dashboard budget label`.
>
> DONE CRITERIA: dashboard cards show concrete budget with per-person/total qualifier.

---

#### Task 10 — Home-page "Two ways to book" section

**Branch:** `feat/audit-polish` (worktree B)
**File(s):** `provodnik.app/src/app/(home)/page.tsx`
**Effort:** 1.5 hours
**Depends on:** Alex copy approval on Slack

**Cursor-agent prompt skeleton:**

> CONTEXT: Home page currently has a single CTA pulling all visitors into Биржа-mode. Need a 2-card "Two ways to book" section above the fold so visitors self-select Трипстер vs Биржа intent.
>
> SCOPE: insert a 2-column responsive section right below the hero (or above it — orchestrator picks based on layout).
>
> COPY (orchestrator-drafted, Alex-approved):
> - Left card title: "Готовый тур"
> - Left card body: "Выберите готовый тур у гида и забронируйте напрямую"
> - Left card CTA: "Смотреть туры" → `/listings`
> - Right card title: "Свой запрос"
> - Right card body: "Опишите, что хотите — гиды предложат вам варианты с ценой"
> - Right card CTA: "Создать запрос" → `/traveler/requests/new`
>
> KNOWLEDGE:
> - PATTERNS.md: home page uses glass-card pattern; max-width container; mobile-first responsive.
> - DESIGN: visual weight equal between the two cards; same height; same CTA style.
>
> TASK:
> 1. Read app/(home)/page.tsx.
> 2. Add the section component (inline or new file under features/home/).
> 3. Mobile: stack vertically; tablet+ : side-by-side.
> 4. Commit: `[audit-polish] task-10: home two-ways-to-book section`.
>
> DONE CRITERIA: section renders responsive on 375px / 768px / 1280px widths; both CTAs route correctly.

**Pre-deploy gate:** ping Alex on Slack with rendered staging URL; wait for ✓ before merging to main.

---

## Dependency map

```
Task 5  (validate publish)      ─── independent ─── ship anytime
Task 4  (book page guard)       ─── independent
Task 3  (booking form fallback) ─── independent
Task 2  (orders branch)         ─── must merge BEFORE Task 1
Task 1  (excursion CTA swap)    ─── after Task 2
                                       ↓
[Worktree A merge to main: ff-only, atomic]

Task 6  (W-04 budget fix)       ─── independent
Task 9  (dashboard label)       ─── after Task 6 (per_person flag)
Task 7  (guide-card link wrap)  ─── independent
Task 8  (hoist bid CTA)         ─── independent
Task 10 (home section)          ─── after Alex copy approval
                                       ↓
[Worktree B merge to main: ff-only]
```

## Merge order

1. Worktree A: Task 2 → 5 → 4 → 3 → 1 (sequential within worktree). Merge worktree A to main.
2. Post-merge integration QA on main: walkthrough steps 1, 2 from spec.
3. Worktree B: 6 → 9 in chain; 7, 8, 10 independent. Merge to main as each clears review.
4. Post-merge integration QA: full walkthrough.
5. Run one-off SQL: mark NULL-price published listings as draft.
6. Ping Alex with staging URL for retest.

## Rollback plan

Per CLAUDE.md §11: each merge is a checkpoint. If post-merge integration fails:
1. `git revert --no-commit HEAD`
2. Reopen worktree, mutate prompt with failure context, re-dispatch.
3. Do not debug forward more than once — rollback wins.

## SOT updates after this batch

- `ERRORS.md`: add ERR-018 if Task 2 reveals an actual orders rendering bug.
- `PATTERNS.md`: add booking-form fallback pattern, home-page two-card section pattern.
- `DECISIONS.md`: add ADR-028 — "Two-mode architecture: route-owned, not data-owned."
- `ANTI_PATTERNS.md`: add AP-009 — "Routing listing-detail CTAs to bid wizard. Use /listings/[id]/book for direct booking; reserve wizard for new requests."
- `METRICS.md`: log task count, hours actual vs estimated, scoring per task.
- `NEXT_PLAN.md`: update STATUS block (already has placeholder).

## Slack dev-note (post-deploy)

Schema:
```json
{
  "theme": "разделение на готовый тур и свой запрос",
  "items": [
    { "kind": "fix", "area": "Готовый тур", "text": "Кнопка на странице тура теперь сразу открывает форму бронирования, а не биржу" },
    { "kind": "improve", "area": "Кабинет гида", "text": "Гид видит и подтверждает прямые заказы рядом с заявками" },
    { "kind": "fix", "area": "Бюджет", "text": "Бюджет в запросах теперь корректно указывается на человека или за группу" },
    { "kind": "improve", "area": "Главная", "text": "На главной появился выбор: готовый тур или свой запрос" },
    { "kind": "fix", "area": "Карточки", "text": "Карточки туров и запросов кликабельны целиком" }
  ],
  "capabilities": [
    "Путешественник открывает страницу готового тура и сразу бронирует — без создания заявки на биржу",
    "Гид принимает прямые бронирования из готовых туров одним кликом",
    "Путешественник на главной выбирает: готовый тур или собственный запрос с предложениями от гидов"
  ]
}
```

Wrapper: `node .claude/logs/slack-devnote.mjs <items.json>` per CLAUDE.md.
