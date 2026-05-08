# Provodnik Launch Readiness — Implementation Plan

> **For agentic workers:** This is the orchestrator's master plan. Implementation is dispatched via `cursor-dispatch.mjs` per CLAUDE.md §4 / §7. Native Claude Code Agents run only research, review, and coordination. Step checkboxes (`- [ ]`) track per-task progress.

**Goal:** Bring Provodnik to full v1 product completeness — close the missing matching system (the "липа в сердце сайта"), finish the queued polish plans, and pass page-by-page acceptance across all six remaining surface groups. No date pressure, no shortcuts.

**Architecture:** Five-phase rollout grounded in the spec at `docs/superpowers/specs/2026-05-02-provodnik-launch-readiness-design.md`. Each phase has a hard gate. Plans inside a phase parallelise where files are disjoint; phases never overlap. Implementation goes through cursor-agent only — orchestrator runs all git, typecheck, lint, and Supabase Management API calls.

**Tech Stack:**
- Next.js 15 App Router, React 19, TypeScript strict
- Supabase Postgres (`@supabase/ssr`) — RLS-aware server client, service-role admin client for migrations
- Tailwind v4
- Vitest 1.x — `vi.mock(import(...))` pattern for module mocks
- Bun runtime / scripts

---

## Source-of-truth pointers

| Artifact | Location |
|----------|----------|
| Design spec (parent) | `docs/superpowers/specs/2026-05-02-provodnik-launch-readiness-design.md` |
| Synthesis of sessions | `_archive/bek-frozen-2026-05-08/sessions/synthesis-2026-05-02.md` |
| Existing plan briefs | `_archive/bek-frozen-2026-05-08/prompts/out/plan-{44,46,47,48-shipped,49,50,51}.md` |
| HOT landmines | `_archive/bek-frozen-2026-05-08/sot/HOT.md` |
| Кодекс «Протуберанец» | `_archive/bek-frozen-2026-05-08/sot/KODEX.md` |
| Discipline traps | `_archive/bek-frozen-2026-05-08/checklists/discipline-traps.md` |
| Cards typography spec | `_archive/bek-frozen-2026-05-08/specs/cards-typography.md` |
| Sweep tracker | `_archive/bek-frozen-2026-05-08/checklists/codex-protuberanets-sweep.md` |
| Post-deploy checklist | `_archive/bek-frozen-2026-05-08/checklists/post-deployment-verification.md` |

---

## Pre-flight corrections (must apply BEFORE Phase 1 dispatches)

These are gaps discovered during plan-writing that invalidate parts of the existing plan briefs. Fix in the briefs first, then dispatch.

### PF-1 — `src/data/interests.ts` is stale (Plan 48 cleanup incomplete)

**Discovered 2026-05-02:** Plan 48 dropped `adventure` and `nightlife` from the homepage form (`homepage-request-form.tsx`) and the four label dictionaries (`bid-form-panel.tsx`, `guide-requests-inbox-screen.tsx`, `active-request-card.tsx`, `traveler-request-detail-screen.tsx`). It did NOT touch `src/data/interests.ts`, which still exports `INTEREST_CHIPS` with 10 entries. The multi-step request wizard step `src/features/requests/components/steps/step-interests.tsx` reads from `INTEREST_CHIPS` and renders all 10 chips. A traveler going through the wizard can still pick `adventure` or `nightlife`, get those values written into `traveler_requests.interests`, and break Plan 50 T1's check constraint at the join level (when guides have specializations limited to the canonical 8).

**Fix:** apply directly (orchestrator, no cursor-agent — single literal removal of two lines).

- [ ] **Step 1: Edit `src/data/interests.ts`**

```ts
export const INTEREST_CHIPS = [
  { id: "history", label: "История" },
  { id: "architecture", label: "Архитектура" },
  { id: "nature", label: "Природа" },
  { id: "food", label: "Гастрономия" },
  { id: "art", label: "Искусство" },
  { id: "photo", label: "Фото" },
  { id: "kids", label: "Для детей" },
  { id: "unusual", label: "Необычное" },
] as const;
```

(Drops `adventure` and `nightlife`. Order preserved from the canonical list in Plan 50 T1.)

- [ ] **Step 2: Verify wizard renders 8 chips**

Run: `cd provodnik.app && bun run typecheck` → 0 errors expected.

Run: `cd provodnik.app && bun run dev` (background) → open `/requests/new` → step "Интересы" → confirm 8 chips, no "Активный отдых", no "Ночная жизнь".

- [ ] **Step 3: Commit**

```bash
git add provodnik.app/src/data/interests.ts
git commit -m "fix(interests): drop adventure+nightlife from canonical chip list

Plan 48 cleaned up the homepage form + 4 label dictionaries but missed the
canonical INTEREST_CHIPS source in src/data/interests.ts. The wizard
step-interests.tsx reads from it directly, so travelers could still submit
the dropped categories — which would then violate Plan 50 T1's check
constraint on guide_profiles.specializations. Closes the gap before Plan 50
ships."
```

### PF-2 — Plan 47 T1 file path correction

**Discovered 2026-05-02:** The brief at `_archive/bek-frozen-2026-05-08/prompts/out/plan-47-task-1.md` lists the file as `src/features/listings/components/public/public-guides-grid.tsx`. The actual file is at `src/features/guide/components/public/public-guides-grid.tsx`. Cursor-agent following the brief verbatim would either fail to open the file or create a duplicate.

**Fix:** apply directly (orchestrator).

- [ ] **Step 1: Edit `_archive/bek-frozen-2026-05-08/prompts/out/plan-47-task-1.md`**

Replace every occurrence of:
```
src/features/listings/components/public/public-guides-grid.tsx
```
with:
```
src/features/guide/components/public/public-guides-grid.tsx
```

(Three occurrences: section "Files in scope (ONLY these three)", section "Step 3", section "VERIFICATION" implicit reference.)

- [ ] **Step 2: Commit**

```bash
git add _archive/bek-frozen-2026-05-08/prompts/out/plan-47-task-1.md
git commit -m "fix(plan-47): correct public-guides-grid path to features/guide/components/public"
```

### PF-3 — Plan 50 T2 editor location pinning

**Discovered 2026-05-02:** The brief at `_archive/bek-frozen-2026-05-08/prompts/out/plan-50-task-2.md` says "Find the guide-profile editor (likely `src/features/guide/components/profile/guide-profile-form.tsx` or a similar path under `src/app/(protected)/guide/profile/`)". Reality: the guide profile editor lives at `src/app/(protected)/profile/guide/about/guide-about-form.tsx` and is rendered through `src/app/(protected)/guide/profile/page.tsx` (which imports it). The save action is `src/app/(protected)/profile/guide/about/actions.ts` (`saveGuideAboutAction`).

**Fix:** apply directly (orchestrator) — replace the "find it" instruction with concrete paths.

- [ ] **Step 1: Edit `_archive/bek-frozen-2026-05-08/prompts/out/plan-50-task-2.md`**

Replace the "File location" section with:

```markdown
## File location

- Editor component: `src/app/(protected)/profile/guide/about/guide-about-form.tsx`
- Server action: `src/app/(protected)/profile/guide/about/actions.ts` (`saveGuideAboutAction`)
- Page that renders it: `src/app/(protected)/guide/profile/page.tsx` (imports `GuideAboutForm` and passes `initialBio`, `initialLanguages`, `initialYearsExperience` — extend props to also pass `initialSpecializations: string[]`)
- Server fetch (read side): inside `GuideProfilePage()` — extend the `select(...)` call on `guide_profiles` to include `specializations`, then pass it through to `<GuideAboutForm initialSpecializations={profile?.specializations ?? []} />`.
```

- [ ] **Step 2: Commit**

```bash
git add _archive/bek-frozen-2026-05-08/prompts/out/plan-50-task-2.md
git commit -m "fix(plan-50): pin guide profile editor paths exactly"
```

---

## Phase 1 — Unblock CI

**Goal:** zero failing tests in the suite.

**Plan 49** (4 tasks). Already fully written at `_archive/bek-frozen-2026-05-08/prompts/out/plan-49.md` + `plan-49-task-{1,2,3,4}.md`. All three fixes are mechanical.

### Task 1.1 — Plan 49 T1 (homepage form button label)

**Files:**
- Modify: `provodnik.app/src/features/homepage/components/homepage-request-form.test.tsx`

**Approach:** apply DIRECTLY. Single regex change in `fillMinimalForm`. Does not justify a cursor-agent dispatch (per `feedback_skip_cursor_for_pure_deletes.md` — small, mechanical edits → orchestrator applies).

- [ ] **Step 1: Open `homepage-request-form.tsx` and read the current button label**

```bash
grep -n "button\|<button" provodnik.app/src/features/homepage/components/homepage-request-form.tsx | head -10
```

Identify the exact label of the button that expands the interests panel. Note the verb (likely "Дополнить запрос" or current equivalent).

- [ ] **Step 2: Update the test regex**

In `homepage-request-form.test.tsx`, find:
```ts
fireEvent.click(screen.getByRole("button", { name: /уточнить запрос/i }));
```
Replace `/уточнить запрос/i` with the regex matching the current button label.

- [ ] **Step 3: Run the affected test**

```bash
cd provodnik.app && bun run test:run -- homepage-request-form
```

Expected: 0 failures in `homepage-request-form.test.tsx`.

- [ ] **Step 4: Commit**

```bash
git add provodnik.app/src/features/homepage/components/homepage-request-form.test.tsx
git commit -m "test(plan-49 t1): align homepage form test to current button label"
```

### Task 1.2 — Plan 49 T2 (next/navigation mock)

**Files:**
- Modify: `provodnik.app/src/features/traveler/components/requests/confirmed-booking-card.test.tsx`

**Approach:** apply DIRECTLY. Mechanical addition of standard `vi.mock` pattern.

**Context7 reference (Vitest):** `vi.mock(import('module'), () => ({...}))` pattern is the canonical way; factory-first form. The string-path form (`vi.mock('next/navigation', () => ({...}))`) is also supported.

- [ ] **Step 1: Edit the test file — add mock at top**

After the existing imports in `confirmed-booking-card.test.tsx`, add:

```ts
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => '/traveler/requests',
  useSearchParams: () => new URLSearchParams(),
}));
```

If `vi` is already imported, do not duplicate the import line.

- [ ] **Step 2: Run the affected test**

```bash
cd provodnik.app && bun run test:run -- confirmed-booking-card
```

Expected: 0 failures, 2 passing tests.

- [ ] **Step 3: Commit**

```bash
git add provodnik.app/src/features/traveler/components/requests/confirmed-booking-card.test.tsx
git commit -m "test(plan-49 t2): mock next/navigation for confirmed booking card"
```

### Task 1.3 — Plan 49 T3 (strip removed `category` field)

**Files:**
- Modify: whatever test files match `grep -rn "category" provodnik.app/src/lib/supabase --include="*.test.ts"` returns.

**Approach:** apply DIRECTLY.

- [ ] **Step 1: Locate hits**

```bash
cd provodnik.app && grep -rn "category" src/lib/supabase --include="*.test.ts"
```

Record every line.

- [ ] **Step 2: For each hit**

- If the line is in a fixture object (`category: "..."` or `category:`): delete the entire line.
- If the line is in an `expect` assertion checking `.category`: delete the assertion (and any surrounding setup that becomes orphaned).

- [ ] **Step 3: Re-grep**

```bash
cd provodnik.app && grep -rn "category" src/lib/supabase --include="*.test.ts"
```

Expected: 0 hits.

- [ ] **Step 4: Run the affected suite**

```bash
cd provodnik.app && bun run test:run -- src/lib/supabase
```

Expected: 0 failures.

- [ ] **Step 5: Commit**

```bash
git add provodnik.app/src/lib/supabase
git commit -m "test(plan-49 t3): strip removed traveler_requests.category from fixtures"
```

### Task 1.4 — Plan 49 T4 (full-suite green check)

- [ ] **Step 1: Run full suite**

```bash
cd provodnik.app && bun run test:run
```

- [ ] **Step 2: Read summary line**

If "0 failed" — Phase 1 gate passes. Move to Phase 2.

If any red surfaces:
- Record the file path + one-line diagnosis.
- Treat as a NEW finding for follow-up (do not fix in this plan — open Plan 49.1).
- Phase 1 gate stays open until the new red is closed.

### Phase 1 gate

- [ ] `bun run test:run` exits with code 0
- [ ] `bun run typecheck` clean
- [ ] `bun run lint` shows no NEW warnings (pre-existing 2 React Compiler warnings on `react-hook-form` `watch()` are accepted)
- [ ] All commits FF-merged to main, pushed, Vercel build status `READY`

---

## Phase 2 — Parallel polish

**Goal:** ship Plans 51, 46, 47 in parallel — they touch disjoint files.

### Pre-Phase 2 actions (orchestrator, before dispatch)

- [ ] **Pre-Phase 2.1 — Anzor SQL pre-check for Plan 47**

Plan 47 T1 hides guides with zero published listings. If no approved guide has any published listing, the `/guides` page becomes empty after deploy. Run the count first.

```sql
-- Run via Supabase Management API or SQL editor on prod project yjzpshutgmhxizosbeef
select count(*) as guides_with_listings
from guide_profiles gp
where gp.verification_status = 'approved'
  and exists (
    select 1 from listings l
    where l.guide_id = gp.user_id
      and l.status = 'published'
  );
```

- If count >= 1: proceed with Plan 47.
- If count == 0: pause Plan 47, open a data-seed plan first.

- [ ] **Pre-Phase 2.2 — Apply pre-flight corrections PF-1, PF-2, PF-3**

(Per their tasks above. Three commits on main before Phase 2 dispatches.)

### Task 2.1 — Plan 51 (homepage discovery block — 3 defects, 1 file)

**Files:**
- Modify: `provodnik.app/src/features/homepage/components/homepage-discovery.tsx`

**Approach:** dispatch via cursor-agent in worktree `provodnik-51`. Single file, three sub-tasks bundled into one prompt because they all touch the same component and should ship in one commit.

**Branch:** `plan-51/homepage-discovery`

- [ ] **Step 1: Create worktree**

```bash
git worktree add D:/dev2/worktrees/provodnik-51 -b plan-51/homepage-discovery
```

- [ ] **Step 2: Compose cursor-agent prompt**

Use existing briefs as source: `_archive/bek-frozen-2026-05-08/prompts/out/plan-51-task-1.md`, `plan-51-task-2.md`, `plan-51-task-3.md`. Compose into one bundled prompt at `_archive/bek-frozen-2026-05-08/prompts/out/plan-51-bundled.md` using the skeleton at `_archive/bek-frozen-2026-05-08/prompts/skeleton.md`. Include all three tasks with their exact code blocks. Mandatory KNOWLEDGE section: HOT-NEW Ревизия Бека + ADR-025 (no git/bun in prompts) + cards typography spec excerpt.

- [ ] **Step 3: Dispatch**

```bash
node D:/dev2/projects/provodnik/.claude/logs/cursor-dispatch.mjs \
  D:/dev2/projects/provodnik/_archive/bek-frozen-2026-05-08/prompts/out/plan-51-bundled.md \
  --workspace "D:\\dev2\\worktrees\\provodnik-51\\provodnik.app" \
  --timeout 600
```

- [ ] **Step 4: Verify cursor-agent output**

Read `_archive/bek-frozen-2026-05-08/logs/cursor-dispatch-*.log` (latest). Confirm `result success`. If `BLOCKED` or `ZERO_COMMIT` — apply directly per ERR-049 fallback (the changes are well-defined enough).

- [ ] **Step 5: Verify diff**

```bash
cd D:/dev2/worktrees/provodnik-51 && git diff main..plan-51/homepage-discovery -- provodnik.app/src/features/homepage/components/homepage-discovery.tsx
```

Confirm:
- `p-5` → `p-4 md:px-6 md:py-5`
- `gap-3` added to the link
- All `mb-1` and `mb-3` removed from inner `<p>` elements
- `pb-14` → `pb-24` on the section
- The `if (requests.length === 0) return null;` line is gone
- Empty-state placeholder card present with the agreed copy

- [ ] **Step 6: Local typecheck + lint**

```bash
cd D:/dev2/worktrees/provodnik-51/provodnik.app && bun run typecheck
cd D:/dev2/worktrees/provodnik-51/provodnik.app && bun run lint -- src/features/homepage/components/homepage-discovery.tsx
```

Both: 0 errors.

- [ ] **Step 7: Ревизия Бека (browser proof)**

Open `https://provodnik-app-<branch>.vercel.app/` (preview deploy) at 1280px and 375px under guest. DevTools → measure card padding (20×24 desktop, 16×16 mobile), inter-block gap (12px). Force empty state on a stage where no requests exist (or temporarily edit data layer locally) — verify the placeholder reads correctly.

- [ ] **Step 8: Update sweep tracker**

Edit `_archive/bek-frozen-2026-05-08/checklists/codex-protuberanets-sweep.md`:
- Row #1 (Homepage discovery — request card): mark **compliant** with audit date 2026-05-02.
- Row #2 (Homepage discovery — empty placeholder): mark **compliant**.

- [ ] **Step 9: Merge to main**

```bash
git checkout main
git merge --ff-only plan-51/homepage-discovery
git push origin main
git worktree remove D:/dev2/worktrees/provodnik-51
git branch -d plan-51/homepage-discovery
```

### Task 2.2 — Plan 46 (`/how-it-works` copy)

**Files:**
- Modify: `provodnik.app/src/app/(site)/how-it-works/page.tsx`

**Approach:** dispatch via cursor-agent in worktree `provodnik-46`. The brief at `_archive/bek-frozen-2026-05-08/prompts/out/plan-46-task-1.md` is fully self-contained — every line of the target file is in the prompt.

**Spec answer (from `docs/superpowers/specs/.../launch-readiness-design.md` §9.1):** the brief uses `"Запрос гидам"` as the H2 (correct per spec) and has no description sub-line under either H2 (correct per spec — drops the tautology). No edits to the brief needed.

**Branch:** `plan-46/how-it-works-copy`

- [ ] **Step 1: Create worktree**

```bash
git worktree add D:/dev2/worktrees/provodnik-46 -b plan-46/how-it-works-copy
```

- [ ] **Step 2: Dispatch**

```bash
node D:/dev2/projects/provodnik/.claude/logs/cursor-dispatch.mjs \
  D:/dev2/projects/provodnik/_archive/bek-frozen-2026-05-08/prompts/out/plan-46-task-1.md \
  --workspace "D:\\dev2\\worktrees\\provodnik-46\\provodnik.app" \
  --timeout 300
```

- [ ] **Step 3: Verify diff**

```bash
cd D:/dev2/worktrees/provodnik-46 && git diff main..plan-46/how-it-works-copy
```

Diff touches ONLY `provodnik.app/src/app/(site)/how-it-works/page.tsx`. File matches the target content in the brief.

- [ ] **Step 4: Local typecheck**

```bash
cd D:/dev2/worktrees/provodnik-46/provodnik.app && bun run typecheck
```

0 errors.

- [ ] **Step 5: Ревизия Бека**

Open `/how-it-works` on preview at 1280 + 375 under guest. Confirm:
- H1 "Как это работает", no subtitle
- Section 1 H2 "Запрос гидам", no description paragraph below it
- 3 step cards with one-sentence-each format
- "Создать запрос" button → `/requests/new`
- Section 2 H2 "Готовые экскурсии"
- 3 step cards
- "Смотреть экскурсии" button → `/listings`

- [ ] **Step 6: Merge to main**

```bash
git checkout main
git merge --ff-only plan-46/how-it-works-copy
git push origin main
git worktree remove D:/dev2/worktrees/provodnik-46
git branch -d plan-46/how-it-works-copy
```

### Task 2.3 — Plan 47 T1 (`/guides` filter + count + copy)

**Files:**
- Modify: `provodnik.app/src/data/supabase/queries.ts`
- Modify: `provodnik.app/src/app/(site)/guides/page.tsx`
- Modify: `provodnik.app/src/features/guide/components/public/public-guides-grid.tsx` (path corrected per PF-2)

**Branch:** `plan-47/guides-filter-count`

- [ ] **Step 1: Confirm pre-Phase-2 SQL pre-check passed**

`guides_with_listings` count from Pre-Phase 2.1 must be ≥ 1.

- [ ] **Step 2: Create worktree**

```bash
git worktree add D:/dev2/worktrees/provodnik-47-t1 -b plan-47/guides-filter-count
```

- [ ] **Step 3: Dispatch**

```bash
node D:/dev2/projects/provodnik/.claude/logs/cursor-dispatch.mjs \
  D:/dev2/projects/provodnik/_archive/bek-frozen-2026-05-08/prompts/out/plan-47-task-1.md \
  --workspace "D:\\dev2\\worktrees\\provodnik-47-t1\\provodnik.app" \
  --timeout 600
```

- [ ] **Step 4: Verify diff**

Diff touches ONLY the three named files. `mapGuideRow` signature unchanged. `getGuidesByDestination` and `getGuideBySlug` unchanged.

- [ ] **Step 5: Local typecheck**

```bash
cd D:/dev2/worktrees/provodnik-47-t1/provodnik.app && bun run typecheck
```

0 errors.

- [ ] **Step 6: Ревизия Бека**

Open `/guides` on preview at 1280 + 375 under guest. Confirm:
- Header: "Гиды" only (no eyebrow, no subtitle)
- Search placeholder: "Поиск по имени или региону"
- Each guide card has the listing count line ("N экскурсий" with correct Russian pluralization)
- Guides without published listings are hidden

- [ ] **Step 7: Merge to main**

```bash
git checkout main
git merge --ff-only plan-47/guides-filter-count
git push origin main
git worktree remove D:/dev2/worktrees/provodnik-47-t1
git branch -d plan-47/guides-filter-count
```

### Task 2.4 — Plan 47 T2 (guide profile cleanup)

**Files:**
- Modify: `provodnik.app/src/features/guide/components/public/guide-profile-screen.tsx`

**Branch:** `plan-47/guide-profile-cleanup`

- [ ] **Step 1: Create worktree**

```bash
git worktree add D:/dev2/worktrees/provodnik-47-t2 -b plan-47/guide-profile-cleanup
```

- [ ] **Step 2: Dispatch**

```bash
node D:/dev2/projects/provodnik/.claude/logs/cursor-dispatch.mjs \
  D:/dev2/projects/provodnik/_archive/bek-frozen-2026-05-08/prompts/out/plan-47-task-2.md \
  --workspace "D:\\dev2\\worktrees\\provodnik-47-t2\\provodnik.app" \
  --timeout 300
```

- [ ] **Step 3: Verify diff**

Diff touches ONLY `guide-profile-screen.tsx`. "Связаться с гидом" button gone. Eyebrow `Туры гида` `<p>` deleted entirely. H2 is the static string `"Готовые экскурсии"` (the IIFE is removed).

- [ ] **Step 4: Local typecheck**

```bash
cd D:/dev2/worktrees/provodnik-47-t2/provodnik.app && bun run typecheck
```

0 errors.

- [ ] **Step 5: Ревизия Бека**

Open one guide profile (`/guides/<slug>`) on preview at 1280 + 375 under guest. Confirm:
- No "Связаться с гидом" button anywhere on the page
- Excursions section has H2 "Готовые экскурсии" only — no gray uppercase "Туры гида" eyebrow above it

- [ ] **Step 6: Merge to main**

```bash
git checkout main
git merge --ff-only plan-47/guide-profile-cleanup
git push origin main
git worktree remove D:/dev2/worktrees/provodnik-47-t2
git branch -d plan-47/guide-profile-cleanup
```

### Phase 2 parallelism

Tasks 2.1, 2.2, 2.3, 2.4 all touch disjoint files. Dispatch all four in parallel by spawning four native `Agent` subagents in ONE batched message with `run_in_background: true`. Each Agent owns one worktree and one cursor-dispatch call.

### Phase 2 gate

- [ ] Plans 51, 46, 47 (T1 + T2) all merged to main
- [ ] Vercel build `READY` for the latest deploy
- [ ] Sentry: zero new unresolved issues from these deploys
- [ ] All Ревизия Бека steps confirmed
- [ ] Sweep tracker updated for rows #1, #2, #5

---

## Phase 3 — Functional core (Plan 50)

**Goal:** real matching system. Closes the missing-feature gap that was the "липа в сердце сайта".

**Plan 50** has 5 tasks; T1 must land first, then T2/T3 in parallel, then T4, then T5.

### Task 3.1 — Plan 50 T1 (schema migration)

**Approach:** orchestrator runs directly via Supabase Management API. Cursor-agent has no DB access (per existing brief).

**Files:**
- Create: `provodnik.app/supabase/migrations/20260502000001_add_guide_specializations.sql`

- [ ] **Step 1: Write migration file**

```sql
-- 20260502000001_add_guide_specializations.sql

alter table public.guide_profiles
  add column specializations text[] not null default '{}';

-- Constrain to canonical interest IDs (post-Plan-48 list)
alter table public.guide_profiles
  add constraint guide_specializations_valid
  check (
    specializations <@ array[
      'history',
      'architecture',
      'nature',
      'food',
      'art',
      'photo',
      'kids',
      'unusual'
    ]::text[]
  );

-- GIN index for the && overlap operator used by inbox sort + /guides chip filter
create index guide_profiles_specializations_gin
  on public.guide_profiles
  using gin (specializations);

comment on column public.guide_profiles.specializations is
  'Guide self-declared interest categories. Must match canonical IDs in src/data/interests.ts.';
```

**Context7 reference (Supabase):** `text[]` array column with `<@` (subset) check and `gin` index supporting `&&` overlap is the canonical pattern. PostgREST translates client-side `.overlaps('column', [...])` into the `&&` operator.

- [ ] **Step 2: Apply migration via Supabase Management API**

Use the Supabase MCP plugin (no cursor-agent — orchestrator owns SQL):
```
mcp__plugin_supabase_supabase__authenticate (if not already)
→ apply migration body to project yjzpshutgmhxizosbeef
```

Or via direct SQL execution against the prod project.

- [ ] **Step 3: Verify migration applied**

```sql
select column_name, data_type, column_default, is_nullable
from information_schema.columns
where table_schema='public' and table_name='guide_profiles' and column_name='specializations';
```

Expect: `specializations | ARRAY | '{}' | NO`.

```sql
select id, display_name, specializations
from guide_profiles
order by created_at desc
limit 5;
```

Expect: `specializations = '{}'` on every row.

- [ ] **Step 4: Regenerate TypeScript types**

```bash
cd provodnik.app && bun run db:types
# (or whatever the generate-types command is — check package.json scripts)
```

This updates `src/lib/supabase/types.ts` to include the new column. Required so T2 can reference `GuideProfileRow.specializations` without TS errors.

- [ ] **Step 5: Commit migration + types**

```bash
git add provodnik.app/supabase/migrations/20260502000001_add_guide_specializations.sql provodnik.app/src/lib/supabase/types.ts
git commit -m "feat(db): add guide_profiles.specializations text[] (plan 50 t1)

Adds the column, check constraint against the 8 canonical interest IDs
(post-Plan-48 list), and a GIN index for the && overlap operator used by
inbox sort and the /guides chip filter. Default is empty array, so existing
guides remain in 'no preference set' state until they pick chips themselves."
git push origin main
```

### Task 3.2 — Plan 50 T2 (cabinet editor)

**Approach:** cursor-agent in worktree. The brief at `_archive/bek-frozen-2026-05-08/prompts/out/plan-50-task-2.md` is updated by PF-3 to include exact paths.

**Files:**
- Modify: `provodnik.app/src/app/(protected)/profile/guide/about/guide-about-form.tsx`
- Modify: `provodnik.app/src/app/(protected)/profile/guide/about/actions.ts`
- Modify: `provodnik.app/src/app/(protected)/guide/profile/page.tsx` (extend `select` + pass new prop)
- Create (new shared chip component): `provodnik.app/src/features/shared/components/interest-chip-group.tsx` (extracted from `step-interests.tsx` so it's reusable from both the wizard and the guide cabinet)

**Branch:** `plan-50/specializations-editor`

- [ ] **Step 1: Read existing chip implementation**

Read `provodnik.app/src/features/requests/components/steps/step-interests.tsx` to capture the `ChipButton` styling so the cabinet's editor matches the wizard exactly.

- [ ] **Step 2: Create worktree**

```bash
git worktree add D:/dev2/worktrees/provodnik-50-t2 -b plan-50/specializations-editor
```

- [ ] **Step 3: Compose prompt**

Pull the brief at `_archive/bek-frozen-2026-05-08/prompts/out/plan-50-task-2.md` (after PF-3 fix). Wrap it in the skeleton at `_archive/bek-frozen-2026-05-08/prompts/skeleton.md` with HOT entries: AP-014 (client/server import boundary — the new shared chip component must be `'use client'` and only import types from server modules), ADR-025 (no git/bun).

The prompt must specify:
- Helper text exactly: `Отметьте темы, по которым вы готовы вести экскурсии. Запросы по этим темам будут показаны в верху вашей ленты. Остальные запросы по-прежнему видны.`
- Section title exactly: `Темы экскурсий`
- The shared chip group accepts `value: string[]`, `onChange: (next: string[]) => void`, `chips: ReadonlyArray<{id:string,label:string}>` from the canonical `INTEREST_CHIPS`.
- `saveGuideAboutAction` Zod schema gets `specializations: z.array(z.enum(['history','architecture','nature','food','art','photo','kids','unusual']))` (mirrors the DB check constraint).

- [ ] **Step 4: Dispatch**

```bash
node D:/dev2/projects/provodnik/.claude/logs/cursor-dispatch.mjs \
  D:/dev2/projects/provodnik/_archive/bek-frozen-2026-05-08/prompts/out/plan-50-task-2.md \
  --workspace "D:\\dev2\\worktrees\\provodnik-50-t2\\provodnik.app" \
  --timeout 900
```

- [ ] **Step 5: Verify diff**

Diff touches only the four files above (plus possibly `step-interests.tsx` if the agent moved instead of duplicated the chip group — that's acceptable; verify it now imports from the shared location).

- [ ] **Step 6: Local typecheck**

```bash
cd D:/dev2/worktrees/provodnik-50-t2/provodnik.app && bun run typecheck
```

0 errors.

- [ ] **Step 7: Ревизия Бека (full save round-trip)**

1. Login as `guide@provodnik.app` on preview deploy.
2. Open `/guide/profile`.
3. Scroll to "Темы экскурсий".
4. Tick three chips. Click save. Wait for `saved` state.
5. Reload the page. Confirm the same three chips are still ticked.
6. Untick all three. Save. Reload. Confirm zero ticked.
7. 375px width — chips wrap, tap targets ≥40px tall.

- [ ] **Step 8: Merge to main**

```bash
git checkout main
git merge --ff-only plan-50/specializations-editor
git push origin main
git worktree remove D:/dev2/worktrees/provodnik-50-t2
git branch -d plan-50/specializations-editor
```

### Task 3.3 — Plan 50 T3 (inbox sort + badge)

**Approach:** cursor-agent in worktree. Uses Postgres `&&` overlap operator (Option A from the brief — preferred).

**Files:**
- Modify: the guide-inbox query (locate via `grep -rn "guide-requests-inbox\|guide_inbox" provodnik.app/src/features/guide`). Most likely `provodnik.app/src/features/guide/components/requests/guide-requests-inbox-screen.tsx` and its sibling `actions.ts` or `queries.ts`.
- Modify: the inbox card component to render the badge pill.

**Branch:** `plan-50/inbox-sort-badge`

- [ ] **Step 1: Locate inbox query**

```bash
cd provodnik.app && grep -rn "guide-requests-inbox\|guide_inbox\|guideInbox" src/features/guide src/app/\(protected\)/guide/inbox 2>&1
```

Identify:
- The function fetching requests for the inbox (probably reads `traveler_requests` filtered by city + status)
- The component rendering each request card (likely `guide-requests-inbox-screen.tsx`)
- An existing pill component in the family (re-use, do not invent a new style)

- [ ] **Step 2: Create worktree**

```bash
git worktree add D:/dev2/worktrees/provodnik-50-t3 -b plan-50/inbox-sort-badge
```

- [ ] **Step 3: Compose prompt**

Use brief at `_archive/bek-frozen-2026-05-08/prompts/out/plan-50-task-3.md`. Include:
- The exact paths discovered in Step 1.
- The chosen sort variant (boolean form — see below).
- HOT entries: AP-014 (client/server boundary if the inbox screen mixes both), ADR-025 (no git/bun).

**Sort SQL (chosen):** the boolean `&&` form for simplicity:
```sql
ORDER BY
  (req.interests::text[] && gp.specializations) DESC,  -- true (overlap) first
  req.created_at DESC
```

This requires the query to JOIN to `guide_profiles` on the current guide so `gp.specializations` is in scope. If the existing query doesn't already JOIN, add it.

If raw SQL isn't used (PostgREST `.from('traveler_requests').select(...).order(...)`), implement the partition in TypeScript after fetch (Option B in the brief).

- [ ] **Step 4: Dispatch**

```bash
node D:/dev2/projects/provodnik/.claude/logs/cursor-dispatch.mjs \
  D:/dev2/projects/provodnik/_archive/bek-frozen-2026-05-08/prompts/out/plan-50-task-3.md \
  --workspace "D:\\dev2\\worktrees\\provodnik-50-t3\\provodnik.app" \
  --timeout 900
```

- [ ] **Step 5: Verify diff**

Diff stays within the inbox files. No changes to the homepage, the public site, the request creation flow.

- [ ] **Step 6: Local typecheck**

```bash
cd D:/dev2/worktrees/provodnik-50-t3/provodnik.app && bun run typecheck
```

0 errors.

- [ ] **Step 7: Ревизия Бека (two-guide test)**

Set up via SQL (orchestrator):
1. Pick guide A (`guide@provodnik.app`). `update guide_profiles set specializations = '{history,food}' where user_id = (select id from auth.users where email='guide@provodnik.app');`
2. Pick guide B (second seed guide). Leave `specializations = '{}'`.
3. Submit two test traveller requests from `traveler@provodnik.app`:
   - R1: city Москва, interests `['history']`.
   - R2: city Москва, interests `['nature']`.

Login as guide A on preview, open `/guide/inbox`:
- R1 sits above R2.
- R1 has the "Соответствует вашим темам" pill.
- R2 has no pill.

Login as guide B, open `/guide/inbox`:
- Both R1 and R2 appear in date order.
- Neither has a pill.

- [ ] **Step 8: Merge to main**

```bash
git checkout main
git merge --ff-only plan-50/inbox-sort-badge
git push origin main
git worktree remove D:/dev2/worktrees/provodnik-50-t3
git branch -d plan-50/inbox-sort-badge
```

### Task 3.4 — Plan 50 T4 (`/guides` chip filter)

**Approach:** cursor-agent in worktree. Reads URL `?spec=...` on the server, filters via PostgREST `.overlaps()`. Client component reads/writes URL via `useSearchParams` + `useRouter().replace()`.

**Files:**
- Modify: `provodnik.app/src/features/guide/components/public/public-guides-grid.tsx` (chip row UI + URL state)
- Modify: `provodnik.app/src/app/(site)/guides/page.tsx` (server fetch reads `searchParams.spec`, passes filter)
- Modify: `provodnik.app/src/data/supabase/queries.ts` (extend `getGuides` to accept a `specializations: string[]` filter — if non-empty, add `.overlaps('specializations', [...])` to the query)

**Branch:** `plan-50/guides-chip-filter`

**Context7 reference (Next.js App Router):** server pages receive `searchParams: Promise<{...}>` and must `await` it before reading. Client components use `useSearchParams()` to read and `useRouter().replace(pathname + '?' + qs)` to write — see `createQueryString` pattern from the docs.

- [ ] **Step 1: Create worktree**

```bash
git worktree add D:/dev2/worktrees/provodnik-50-t4 -b plan-50/guides-chip-filter
```

- [ ] **Step 2: Compose prompt**

Use brief at `_archive/bek-frozen-2026-05-08/prompts/out/plan-50-task-4.md`. Include:
- Exact filter wiring (server reads `searchParams.spec`, splits by comma, validates each ID against the canonical 8, drops invalid, passes valid set to `getGuides({ specializations: [...] })`).
- `getGuides` extension: when `filters.specializations?.length`, add `.overlaps('specializations', filters.specializations)` to the `guide_profiles` query.
- Client chip group: `'use client'` component sitting under the search input. Reads `useSearchParams().get('spec')?.split(',') ?? []`. On chip toggle, computes new array, builds new search string, calls `router.replace(pathname + '?' + new URLSearchParams({ spec: next.join(',') }).toString(), { scroll: false })`. Empty next set → drop the param entirely.
- "Сбросить" link: visible when `spec` param is non-empty. `onClick` calls `router.replace(pathname, { scroll: false })`.
- Mobile: chip row is `flex overflow-x-auto snap-x` so it scrolls horizontally without wrapping.

- [ ] **Step 3: Dispatch**

```bash
node D:/dev2/projects/provodnik/.claude/logs/cursor-dispatch.mjs \
  D:/dev2/projects/provodnik/_archive/bek-frozen-2026-05-08/prompts/out/plan-50-task-4.md \
  --workspace "D:\\dev2\\worktrees\\provodnik-50-t4\\provodnik.app" \
  --timeout 900
```

- [ ] **Step 4: Verify diff**

Diff touches the three files above. No regressions to other pages.

- [ ] **Step 5: Local typecheck**

```bash
cd D:/dev2/worktrees/provodnik-50-t4/provodnik.app && bun run typecheck
```

0 errors.

- [ ] **Step 6: Ревизия Бека**

Setup: ensure at least 2 approved guides have non-empty `specializations` (one with `{history}`, one with `{food}`).

On preview:
- `/guides` (no param) — both guides visible.
- `/guides?spec=history` — only the history guide visible. URL has `?spec=history`. "Сбросить" link visible.
- `/guides?spec=history,food` — both guides visible (overlap match).
- Click a chip while `?spec=history` active → it toggles off → URL becomes `/guides`. "Сбросить" disappears.
- 375px: chip row scrolls horizontally, no wrapping. Tap targets ≥40px.

- [ ] **Step 7: Merge to main**

```bash
git checkout main
git merge --ff-only plan-50/guides-chip-filter
git push origin main
git worktree remove D:/dev2/worktrees/provodnik-50-t4
git branch -d plan-50/guides-chip-filter
```

### Task 3.5 — Plan 50 T5 (CSV backfill)

**Approach:** orchestrator-only. Generate a CSV proposal; admin reviews; admin runs SQL.

**Files:**
- Create: `provodnik.app/scripts/generate-specializations-proposal.ts` (Bun-runnable script)
- Output: `_archive/bek-frozen-2026-05-08/data/specializations-proposal.csv`

- [ ] **Step 1: Write the script**

```ts
// provodnik.app/scripts/generate-specializations-proposal.ts
import { writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const KEYWORDS: Record<string, string[]> = {
  history: ['истори', 'историк'],
  architecture: ['архитектур', 'зодчеств'],
  nature: ['природ', 'парк', 'заповедник'],
  food: ['гастроном', 'кухн', 'дегустац', 'ресторан', 'ужин'],
  art: ['искусств', 'музе', 'галере'],
  photo: ['фотограф', 'фотопрогул'],
  kids: ['дет', 'семейн'],
  unusual: ['необычн', 'нестандартн', 'авторск'],
};

async function main() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from('guide_profiles')
    .select('id, user_id, display_name, home_base, biography, specializations')
    .eq('verification_status', 'approved')
    .order('created_at');

  if (error) throw error;

  const rows = ['guide_id,user_id,display_name,home_base,proposed,source_keywords'];
  for (const g of data ?? []) {
    const bio = (g.biography ?? '').toLowerCase();
    const found: { spec: string; kw: string }[] = [];
    for (const [spec, kws] of Object.entries(KEYWORDS)) {
      const hit = kws.find((kw) => bio.includes(kw));
      if (hit) found.push({ spec, kw: hit });
    }
    rows.push([
      g.id,
      g.user_id,
      JSON.stringify(g.display_name ?? ''),
      JSON.stringify(g.home_base ?? ''),
      `"${found.map((f) => f.spec).join(',')}"`,
      `"${found.map((f) => f.kw).join('|')}"`,
    ].join(','));
  }

  await writeFile('_archive/bek-frozen-2026-05-08/data/specializations-proposal.csv', rows.join('\n'), 'utf-8');
  console.log(`Wrote ${rows.length - 1} guide proposals.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Ensure `_archive/bek-frozen-2026-05-08/data/` exists**

```bash
mkdir -p D:/dev2/projects/provodnik/_archive/bek-frozen-2026-05-08/data
```

- [ ] **Step 3: Run the script**

```bash
cd provodnik.app && \
  SUPABASE_URL="<prod url>" \
  SUPABASE_SERVICE_ROLE_KEY="<prod service-role key from codex-ops/.env.local>" \
  bun run scripts/generate-specializations-proposal.ts
```

- [ ] **Step 4: Verify output**

```bash
head -20 D:/dev2/projects/provodnik/_archive/bek-frozen-2026-05-08/data/specializations-proposal.csv
```

Expect a header row plus N data rows, where N = approved guides.

- [ ] **Step 5: Hand off to admin**

Add a `_archive/bek-frozen-2026-05-08/data/specializations-proposal.csv.README.md` with a one-line description and the SQL pattern for applying:
```sql
update guide_profiles set specializations = '{history,food}'::text[] where id = '...';
```

- [ ] **Step 6: Commit script + README (NOT the CSV — it's gitignored data)**

```bash
git add provodnik.app/scripts/generate-specializations-proposal.ts
git commit -m "feat(plan-50 t5): script to generate specialization backfill proposal"
git push origin main
```

### Phase 3 gate

- [ ] Migration `20260502000001` applied to prod, verified by SELECT
- [ ] TypeScript types regenerated
- [ ] T2, T3, T4 all merged, Vercel `READY`, Sentry clean
- [ ] Two-guide inbox sort verified (R1 above R2 with badge under guide A; R1 = R2 in date order under guide B)
- [ ] `/guides?spec=history` filter works on preview
- [ ] CSV proposal generated, README written, handed off to admin

---

## Phase 4 — Page-by-page acceptance (ПППД D + C + E + F + G + H, Plan 44 + new audit plans)

**Goal:** every cabinet page and every public page passes a real browser audit at 1280 + 375 under the right role.

### Pre-Phase 4 actions

- [ ] **Pre-Phase 4.1 — Anzor adds chrome-devtools-mcp permissions**

Anzor edits `.claude/settings.json` to add the `mcp__chrome-devtools-mcp__*` entries listed in `_archive/bek-frozen-2026-05-08/prompts/out/plan-44.md`. This is a one-time human action — orchestrator cannot do it (Claude Code blocks Edit/Write to its own settings.json per memory entry 2026-04-30).

### Task 4.1 — Plan 44 (ПППД-D, guide cabinet, 17 routes)

**Approach:** orchestrator-driven browser audit using `chrome-devtools-mcp`. Each finding becomes a row in `_archive/bek-frozen-2026-05-08/sot/findings-plan-44.md`. Findings turn into Plan 52 tasks afterwards.

**Files:**
- Create: `_archive/bek-frozen-2026-05-08/sot/findings-plan-44.md`

- [ ] **Step 1: Login as guide on prod**

Use `mcp__chrome-devtools-mcp__new_page` + `navigate_page` to `https://provodnik.app/sign-in`. Fill `guide@provodnik.app` / `SeedPass1!`. Submit. Confirm redirect to `/guide`.

- [ ] **Step 2: Audit at 1280px — all 17 routes**

For each of the 17 routes in `_archive/bek-frozen-2026-05-08/prompts/out/plan-44.md`:
1. `resize_page` to 1280×800.
2. `navigate_page` to the route.
3. `take_snapshot` and `take_screenshot`.
4. Inspect: visual breakage, fake data, broken empty states, console errors (`list_console_messages`).
5. Append findings to `_archive/bek-frozen-2026-05-08/sot/findings-plan-44.md` using the format in the brief.

- [ ] **Step 3: Audit at 375px — all 17 routes**

Same procedure with `resize_page 375×667`. Append findings (label as Mobile).

- [ ] **Step 4: Compile findings index**

At the top of `findings-plan-44.md`, add:
- Total findings count
- Breakdown by severity (P0 / P1 / P2)
- Top 3 by priority

- [ ] **Step 5: If findings exist → write Plan 52**

If `findings-plan-44.md` lists any P0 or P1 issues, create `_archive/bek-frozen-2026-05-08/prompts/out/plan-52.md` with one task per finding. Use the same task-template as Plan 51 (file path, exact change, verification step). Dispatch via cursor-agent OR apply directly per ERR-055 rule (small-mechanical → direct).

If only P2/cosmetic — Alex decides whether to fix now or defer.

- [ ] **Step 6: After fixes ship → Ревизия Бека**

Re-audit all flagged pages, confirm zero recurrence.

### Task 4.2 — ПППД-C (traveler cabinet)

**Files:**
- Create: `_archive/bek-frozen-2026-05-08/prompts/out/plan-53.md` (the audit plan)
- Create: `_archive/bek-frozen-2026-05-08/sot/findings-pppd-c.md`

**Routes** (cabinet under `(protected)/traveler/*`):
- `/traveler` (dashboard)
- `/traveler/requests` (list)
- `/traveler/requests/[id]` (detail with offers)
- `/traveler/bookings` (index — was 404 before Plan 43 fix)
- `/traveler/bookings/[bookingId]` (detail)
- `/messages` (chat list)
- `/messages/[threadId]` (chat thread)
- `/profile` (traveler profile/settings)
- (any others discovered via `ls src/app/(protected)/traveler/` + `ls src/app/(protected)/messages/` + `ls src/app/(protected)/profile/`)

**Approach:** identical structure to Task 4.1 but under `traveler@provodnik.app` / `Demo1234!`.

- [ ] **Step 1: Inventory traveler-cabinet routes**

```bash
find provodnik.app/src/app/\(protected\)/traveler provodnik.app/src/app/\(protected\)/messages provodnik.app/src/app/\(protected\)/profile -name "page.tsx" 2>&1
```

Record the full route list.

- [ ] **Step 2: Login as traveler on prod**

`traveler@provodnik.app` / `Demo1234!`.

- [ ] **Step 3: Audit at 1280px — every route**

For each route: `resize 1280×800` → `navigate` → `take_snapshot` → inspect → append findings to `_archive/bek-frozen-2026-05-08/sot/findings-pppd-c.md`.

- [ ] **Step 4: Audit at 375px — every route**

`resize 375×667` → repeat.

- [ ] **Step 5: Compile findings, write Plan 54 if needed**

Same shape as Plan 52 from Task 4.1.

- [ ] **Step 6: After fixes → Ревизия Бека → close ПППД-C**

### Task 4.3 — ПППД-E (request flow as a sequence)

**Goal:** end-to-end audit of the request creation funnel — homepage form/wizard → submit → traveler inbox → guide inbox.

**Routes:**
- `/` (homepage) — both compact and full form
- `/requests/new` (multi-step wizard) — Step Destination → Step Dates → Step Group → Step Interests → Step Review → Submit
- `/traveler/requests` (own request appears)
- `/traveler/requests/[id]` (waiting for offers)
- `/guide/inbox` (under guide login — same request appears, with badge if specs match)

**Approach:** scripted journey, not page-by-page. Two roles required.

- [ ] **Step 1: Submit request as guest from `/`**

Fill homepage form. Submit. Confirm redirect to `/auth?next=/requests/new` (or wherever the guest-first flow goes). Complete sign-up flow.

- [ ] **Step 2: Submit via wizard as logged-in traveler**

`/requests/new`. Walk every step. Confirm transitions, validation, persistence between steps. Note any UX friction (broken back button, lost state, ambiguous copy).

- [ ] **Step 3: Verify request lands in traveler inbox**

`/traveler/requests` → request visible with status indicator → clicking opens detail.

- [ ] **Step 4: Verify request lands in guide inbox**

Login as guide → `/guide/inbox` → same request visible. With Plan 50 T3 in place, badge appears if interests match.

- [ ] **Step 5: Submit a bid as guide**

Open the request → bid form → fill → submit → confirm appears for traveler in offer list.

- [ ] **Step 6: Document findings**

`_archive/bek-frozen-2026-05-08/sot/findings-pppd-e.md`. Findings → Plan 55 if any.

- [ ] **Step 7: After fixes → Ревизия Бека**

### Task 4.4 — ПППД-A residual (public pages not covered by honesty pass)

**Routes:**
- `/destinations/[slug]` (full pass at 1280 + 375 — was only spot-checked)
- `/listings/[slug]` (excursion detail page — full pass)
- `/help`, `/help/[slug]` if dynamic
- `/trust` (was rewritten in Plan 32 — verify still clean)
- `/policies/*` (whichever still live after Plan 33 deletes)
- `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password` (auth surfaces)

- [ ] **Step 1: Inventory remaining public routes**

```bash
find provodnik.app/src/app/\(site\) provodnik.app/src/app/\(public\) -name "page.tsx" 2>&1
```

Cross-check against routes already audited in Plans 31–36. List the residual.

- [ ] **Step 2: Audit each at 1280 + 375**

Findings → `_archive/bek-frozen-2026-05-08/sot/findings-pppd-a-residual.md`.

- [ ] **Step 3: If findings → Plan 56**

### Task 4.5 — ПППД-F / G / H (служебные)

**Goal:** lighter-touch audit of error pages, auth flows, admin (if any), and other utility surfaces.

- [ ] **Step 1: Inventory routes**

`find provodnik.app/src/app -name "page.tsx" -o -name "error.tsx" -o -name "not-found.tsx"` and cross-reference against everything covered in Tasks 4.1–4.4. The remainder is F/G/H combined.

- [ ] **Step 2: One-pass audit at 1280 only (mobile is lower priority for service surfaces)**

Findings → one combined file `_archive/bek-frozen-2026-05-08/sot/findings-pppd-fgh.md`.

- [ ] **Step 3: Plan 57 if needed**

### Phase 4 gate

- [ ] All 6 audit cycles closed (D, C, E, A-residual, F/G/H)
- [ ] All findings either fixed-and-verified OR explicitly deferred with rationale in `_archive/bek-frozen-2026-05-08/sot/DECISIONS.md`
- [ ] Each audit's findings file present and has a "Closed" status block at the top

---

## Phase 5 — Final cross-role walkthrough

**Goal:** one sequential walkthrough across three roles. Zero findings = product is "ready when Alex says go".

### Task 5.1 — Guest journey

- [ ] **Step 1: Browser at 1280, guest (logged out)**

Walk: `/` → click "Создать запрос" CTA → reach `/requests/new` → fill the form → submit → redirected to `/auth` (expected). Back to `/`. Click "Готовые экскурсии" → reach `/listings` → open a listing → check the chrome (no duplicate header/footer per F1 from Plan 43). Back to `/`. Click "Гиды" → reach `/guides` → toggle a chip filter → confirm filter works → open a profile → confirm no "Связаться с гидом" button.

- [ ] **Step 2: Browser at 375, same journey**

- [ ] **Step 3: Document findings (or write "all green")**

`_archive/bek-frozen-2026-05-08/sot/findings-phase-5-guest.md`.

### Task 5.2 — Traveler journey

- [ ] **Step 1: Login as `traveler@provodnik.app` / `Demo1234!` at 1280**

Walk: dashboard → `/traveler/requests` → click into one request → review offers → open chat → return → `/traveler/bookings` (Plan 43 made this exist) → confirm renders.

- [ ] **Step 2: Repeat at 375**

- [ ] **Step 3: Document findings**

`_archive/bek-frozen-2026-05-08/sot/findings-phase-5-traveler.md`.

### Task 5.3 — Guide journey

- [ ] **Step 1: Login as `guide@provodnik.app` / `SeedPass1!` at 1280**

Walk: `/guide` dashboard → `/guide/inbox` (with Plan 50 sort/badge active) → click into a request → bid form → submit (or back out) → `/guide/listings` → "Новое предложение" → `/guide/profile` → "Темы экскурсий" editor (Plan 50 T2) → `/guide/portfolio`.

- [ ] **Step 2: Repeat at 375**

- [ ] **Step 3: Document findings**

`_archive/bek-frozen-2026-05-08/sot/findings-phase-5-guide.md`.

### Task 5.4 — Aggregate decision

- [ ] **Step 1: Total findings across the three role files**

If 0 findings: write `_archive/bek-frozen-2026-05-08/sot/PRODUCT_READY_2026-MM-DD.md` declaring readiness. Notify Alex via Slack (`slack-devnote.mjs`) + Telegram.

If >0 findings: each becomes a task in Plan 58. After Plan 58 ships, repeat Phase 5.

### Phase 5 gate

- [ ] Three role walkthroughs complete on the latest production deploy
- [ ] All findings files closed with "0 findings" or "all addressed in Plan 58 → re-walked clean"
- [ ] `PRODUCT_READY_*.md` written

---

## Decision register (Group 2 forks from spec §9.2)

These are NOT tasks. They are written to `_archive/bek-frozen-2026-05-08/sot/DECISIONS.md` as part of plan execution so they don't drift.

- [ ] **Decision register entry 1 — Monetization model (DEFERRED)**

Append to `_archive/bek-frozen-2026-05-08/sot/DECISIONS.md`:

```markdown
## ADR-NNN — Monetization model deferred to post-launch (2026-05-02)

Status: deferred-with-trigger
Context: v1 launches with 0% commission, no money flow on platform. No
mention of commission, escrow, or in-platform payment in any public copy.

Trigger to revisit: 100 real traveler requests on platform OR 30 days
post-launch traffic, whichever is sooner.

Decision frame at trigger: choose model based on observed behavior —
- Spam offers per guide → pay-per-bid
- Off-platform settlement → lead-fee at contact reveal or contact-after-booking
- Daily inbox engagement → subscription
- Reliable lead-source for guides → freemium with N free offers per month
```

- [ ] **Decision register entry 2 — `/tours` activation (DEFERRED)**

Append:

```markdown
## ADR-NNN — /tours activation deferred (2026-05-02)

Status: deferred-with-trigger
Context: v1 launches with /tours stubbed (notFound() under FEATURE_TR_TOURS=0).

Trigger to revisit: 50+ completed bookings via bid-flow AND ≥2 multi-day
guides willing to be alpha publishers.

Decision frame at trigger:
- Activate /tours (second business half)
- Or deepen /listings (more cities, more categories)
- Or extend /requests (multi-city, fixed-date group tours)
```

- [ ] **Decision register entry 3 — Anti-disintermediation strictness (DEFERRED)**

Append:

```markdown
## ADR-NNN — Anti-disintermediation softening deferred (2026-05-02)

Status: deferred-with-trigger
Context: v1 launches strict — no "contact this guide" button, gid-without-listings
hidden from /guides, no direct contact channel outside platform-mediated chat.

Trigger to revisit: 6 months post-launch OR measurable rate of guides
inviting travelers to Telegram in first chat message (regex sweep over
the first message of each new chat thread).

Decision frame at trigger:
- Internal rating system (disincentive to leave)
- Contact reveal only after first booking (compromise)
- Stay strict (if guides are not leaving)
```

- [ ] **Decision register entry 4 — Push for guides without specs (DEFERRED)**

Append:

```markdown
## ADR-NNN — Push notification "fill specializations" deferred (2026-05-02)

Status: deferred-with-trigger
Context: Plan 50 T2 ships the cabinet editor without an outbound push or
email asking guides to fill their specializations. Ratoinale: the guide
without specs already gets every city request — no functional loss, only
no sort ordering. A push before they have any inbox experience has zero
product-pull.

Trigger to revisit: 30%+ of active guides have specs filled OR 50+ guides
on platform — whichever first. If neither in 60 days, introduce as a
profile-completion-checklist nudge (not a push).
```

---

## Self-review (writing-plans skill checklist)

### Spec coverage check

| Spec section | Plan task(s) | Status |
|--------------|-------------|--------|
| §3 Phase 1 (Plan 49) | Tasks 1.1–1.4 | ✓ |
| §3 Phase 2 (Plans 51, 46, 47) | Tasks 2.1–2.4 + Pre-Phase 2 | ✓ |
| §3 Phase 3 (Plan 50) | Tasks 3.1–3.5 | ✓ |
| §3 Phase 4 (Plan 44 + ПППД C/E/F/G/H + A residual) | Tasks 4.1–4.5 | ✓ |
| §3 Phase 5 (final walkthrough) | Tasks 5.1–5.4 | ✓ |
| §9.1 — `/how-it-works` copy | Task 2.2 (uses Plan 46 brief which now matches the spec answer) | ✓ |
| §9.1 — Push for guides without specs (NOT shipped in v1) | Decision register entry 4 | ✓ |
| §9.2 — Monetization deferred with trigger | Decision register entry 1 | ✓ |
| §9.2 — /tours deferred with trigger | Decision register entry 2 | ✓ |
| §9.2 — Anti-disintermediation deferred with trigger | Decision register entry 3 | ✓ |
| §11 critierion 8 — HOT.md grep clean | Implicit in every cursor-agent prompt's KNOWLEDGE section | ✓ |
| §11 criterion 9 — Sentry clean | Phase gate check at every phase | ✓ |
| §12 out-of-scope items | Excluded — not in any task | ✓ |

### Placeholder scan

Searched for: `TBD`, `TODO`, `implement later`, `add appropriate error handling`, `fill in details`, `Similar to Task N`. None found in this plan body.

### Type / path consistency

- `INTEREST_CHIPS` reduced to 8 in PF-1, then referenced in Plan 50 T1 (check constraint), T2 (Zod schema enum), T4 (validation in URL parser) — all use the same 8 IDs.
- `specializations: text[]` on `guide_profiles` — created in T1, consumed in T2 (read), T3 (sort), T4 (filter), T5 (backfill). Field name consistent throughout.
- `saveGuideAboutAction` — name matches existing code at `provodnik.app/src/app/(protected)/profile/guide/about/actions.ts`.
- File paths in Phase 2 corrected by PF-2 / PF-3 before any cursor-agent dispatches them.

### Scope check

The plan covers six phases of one cohesive launch-readiness initiative. Each phase has ONE gate. Tasks within a phase are independent enough to parallelise where files don't collide. The plan is large but bounded — by design, per the spec's Option C ("полная продуктовая готовность").

The plan does NOT cover: SEO, analytics, legal pages, e-mail deliverability, a11y, performance, bot protection, onboarding emails, monitoring dashboards. These are explicitly out of scope per spec §12. If any becomes a blocker, open a separate spec/plan, do not extend this one.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-02-provodnik-launch-readiness-implementation.md`.

Next step: Alex reviews. After approval — execution proceeds **per CLAUDE.md §7 intercept**: implementation goes via `cursor-dispatch.mjs`, NOT via Task tool subagents. Native `Agent` subagents are used only for parallel coordination of cursor-dispatch calls (one Agent per worktree per phase).

The execution skill is `superpowers:subagent-driven-development` — but every "dispatch implementer" instruction is intercepted and replaced with the cursor-dispatch command per §7.
