# Plans 10 + 11 — Alex Features Implementation

> **For agentic workers:** Use `superpowers:subagent-driven-development` to implement task-by-task. Each task is a separate cursor-agent dispatch.

**Goal:** (1) Wire guide notification system so guides receive in-app notifications when traveler requests match their city/interests/capacity. (2) Clean up homepage copy and enrich request discovery cards with full data.

**Architecture:** Plan 10 extends the existing notification trigger pattern in `triggers.ts` with a three-filter matching query against `guide_profiles`. The DB migration is prerequisite; all TypeScript changes follow. Plan 11 is pure rendering — text replacements and card content enrichment, no data layer changes.

**Tech Stack:** Next.js 15 App Router, Supabase (`@supabase/ssr`), shadcn/ui, Tailwind v4, Bun

**Design specs:**
- Plan 10: `_archive/bek-frozen-2026-05-08/prompts/out/plan-10.md`
- Plan 11: `_archive/bek-frozen-2026-05-08/prompts/out/plan-11.md`

---

## Dependency DAG

```
Plan 10:
T10-1 (DB migration + TS types) ──> T10-2 (guide profile save) ──> T10-3 (notifyGuidesNewRequest) ──> T10-4 (wire into createRequestAction)

Plan 11 (fully independent of Plan 10):
T11-1 (homepage text cleanup)    ─┐
                                  ├─ parallel, no deps between them
T11-2 (discovery card enrichment)─┘
```

## Merge order

1. **T10-1** — `feat/plan-10-notifications` (branch: create from main)
2. **T10-2** — `feat/plan-10-notifications` (same branch, depends on T10-1 merged)
3. **T10-3** — `feat/plan-10-notifications` (same branch, depends on T10-2 merged)
4. **T10-4** — `feat/plan-10-notifications` (same branch, depends on T10-3 merged)
5. **T11-1** — `feat/plan-11-homepage-polish` (parallel with entire Plan 10 chain)
6. **T11-2** — `feat/plan-11-homepage-polish` (parallel with Plan 10 and T11-1)

Plan 11 Tasks 1 and 2 are parallel-safe (different files).

---

## Task summary

### Plan 10 — Guide Notification System

#### Task 10-1 — DB migration + TypeScript types
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-10-task-1.md`
Summary: Creates `supabase/migrations/20260426000001_plan10_guide_notifications.sql` (adds `new_request` to `notification_kind` enum; adds `base_city TEXT` and `max_group_size INTEGER` to `guide_profiles`; creates index on `lower(base_city)`). Updates `src/lib/supabase/types.ts` — adds `new_request` to `NotificationKindDb` union and adds fields to `GuideProfileRow`/`GuideProfileInsert`/`GuideProfileUpdate`. Updates `src/lib/notifications/create-notification.ts` — adds `"new_request"` to the z.enum array. No components touched.

#### Task 10-2 — Fix guide profile save action
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-10-task-2.md`
Depends on: T10-1 merged
Summary: Reads `src/features/guide/components/onboarding/guide-onboarding-form.tsx` to discover the server action that handles the profile/operations section. Modifies that action to persist `base_city` (from `currentBaseCity`) and `max_group_size` (from `groupSizeMax`) to `guide_profiles`. Also adds a Popover tooltip on the `groupSizeMax` field label. Pattern reference: `src/app/(protected)/profile/guide/about/actions.ts`.

#### Task 10-3 — notifyGuidesNewRequest trigger function
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-10-task-3.md`
Depends on: T10-2 merged
Summary: Adds `notifyGuidesNewRequest(requestId: string): Promise<void>` to `src/lib/notifications/triggers.ts`. Fetches the request (destination, interests, participants_count), queries `guide_profiles` for guides where `base_city ILIKE destination`, `specialties` overlaps interests (or specialties is empty → match all), `max_group_size IS NULL OR max_group_size >= participants_count`, `is_available = true`, `verification_status = 'approved'`. Calls `createNotificationForUser` for each via `Promise.allSettled`. Includes unit tests.

#### Task 10-4 — Wire trigger into createRequestAction
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-10-task-4.md`
Depends on: T10-3 merged
Summary: Modifies `src/app/(protected)/traveler/requests/new/actions.ts` only. Imports `notifyGuidesNewRequest` and calls it after `createTravelerRequest()` and BEFORE `redirect()`, wrapped in try-catch that swallows errors — notification failure must never block the traveler. Critical: `redirect()` throws `NEXT_REDIRECT` internally, so any call after it never runs.

---

### Plan 11 — Homepage Polish

#### Task 11-1 — Homepage text + structure cleanup
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-11-task-1.md`
Summary: Five literal text/JSX changes across four files:
1. `homepage-shell2.tsx` — remove `<HomePageSteps />` import + JSX (leave the file on disk, just stop rendering it)
2. `homepage-hero-form.tsx` — remove the "Биржа экскурсий по запросу" label above H1; change H1 → "Опишите запрос — гиды откликнутся"
3. `homepage-request-form.tsx` — change button text "Найти гида" → "Отправить запрос гидам" (loading state "Отправляем…" stays)
4. `src/app/(home)/page.tsx` — change metadata title → "Проводник"

#### Task 11-2 — Discovery section width + card enrichment
Prompt: `_archive/bek-frozen-2026-05-08/prompts/out/plan-11-task-2.md`
Summary: Modifies `src/features/homepage/components/homepage-discovery.tsx` only. Changes section wrapper from `max-w-page` to `max-w-2xl`. Enriches each request card to show: group type ("Своя группа"/"Сборная группа"), participant count (private: "{n} чел.", assembly: "до {n} чел."), up to 4 interest labels via `INTEREST_CHIPS` from `step-interests.tsx` (imported, not inline — must check AP-014 re: server-only split), overflow as "+N", budget as "N ₽/чел." (no "тыс." abbreviation, full locale string). Keeps existing offer count. No query/type changes.

---

## End-to-end verification (run after all tasks merged)

### Plan 10
- [ ] DB migration applied: `guide_profiles` has `base_city` and `max_group_size` columns
- [ ] Guide profile save form persists `base_city` and `max_group_size` to the DB (manual test: fill form, check Supabase row)
- [ ] Tooltip visible on the group capacity field in the guide onboarding form
- [ ] On request creation: `notifications` table receives one row per matching guide with `notification_kind = 'new_request'`
- [ ] On request creation: traveler redirect is NOT blocked when no guides match (empty match set)
- [ ] `bun run typecheck` passes (0 errors)
- [ ] `bun run lint` passes (0 errors)

### Plan 11
- [ ] Homepage loads: H1 reads "Опишите запрос — гиды откликнутся"
- [ ] Homepage loads: no "3 steps" block visible anywhere on the page
- [ ] Submit button reads "Отправить запрос гидам"
- [ ] Browser tab title reads "Проводник" (not "Проводник — Биржа экскурсий по запросу")
- [ ] Discovery section width visually matches the form above it (~672px)
- [ ] Request cards show group type, count, up to 4 interests with overflow "+N", budget as "N ₽/чел."
- [ ] `bun run typecheck` passes (0 errors)
- [ ] `bun run lint` passes (0 errors)

---

## Self-review checklist

- [x] All file paths verified on disk (see R2 table in mega-plan session)
- [x] No gaps in design specs — both plan files enumerate complete requirements
- [x] No cross-plan file collisions — Plans 10 and 11 touch entirely different files
- [x] No intra-plan collisions — each task within a plan edits distinct files
- [x] DAG has no cycles; total ordering exists
- [x] Each task is scoped to ≤60 min of cursor-agent work
- [x] Each task prompt has all 10 required sections (verified T10-1, T10-3, T10-4, T11-1, T11-2)
- [x] T10-4 explicitly notes redirect() behavior (NEXT_REDIRECT throw) — non-obvious critical constraint
- [x] T11-2 notes AP-014 import constraint for INTEREST_CHIPS (server-only risk)
- [ ] Terminology check: "Своя группа" / "Сборная группа" — verify no drift in discovery card task (T11-2 uses correct terms from plan-11.md spec)

---

## Risks and rollback

| Risk | Mitigation |
|---|---|
| DB migration runs before TypeScript types update → type mismatch in TS at runtime | T10-1 covers both in one task; migration SQL + type edits committed together |
| Guide profile save action has multiple entry points (onboarding + separate settings page) | T10-2 uses Investigative persona — reads form to discover all action paths before editing |
| `redirect()` in T10-4 placed after try-catch silently swallows TypeScript error | Task prompt has explicit CRITICAL note + code pattern with correct placement |
| INTEREST_CHIPS import in T11-2 triggers AP-014 (server-only module into 'use client') | Task prompt cites AP-014; `step-interests.tsx` exports from a feature component, not server-only — verify before committing |
| Plan 11 tests: homepage-request-form.test.tsx may fail after button text change | T11-1 SCOPE explicitly notes to update test snapshots if any exist |

Rollback: `git revert <commit>` per task — each task is one commit on one branch.

---

## Out of scope (deferred)

- Email / SMS / push notifications (Plan 10 is in-app only)
- Traveler destination as a dropdown/city-picker (future change)
- Admin notification features
- `dispute_closed` notification type
- Mobile QA pass on homepage changes
- Lighthouse audit
