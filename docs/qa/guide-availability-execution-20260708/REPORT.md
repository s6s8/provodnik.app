# Execution Report — Guide/Admin Availability Controls

**Branch:** `feature/guide-availability-controls-20260708`
**Date:** 2026-07-08 (UTC+3)
**Plan:** `docs/superpowers/plans/2026-07-08-guide-availability-admin-guide.md`

## Summary

Implemented the MVP availability control: a guide can pause/resume taking new
requests from their profile, an admin can view and override that state from the
guide detail page, every change is written to a new append-only audit table, and
the two consistency gaps the plan identified are closed (admin re-approval no
longer clobbers a self-pause; a paused guide can no longer submit new offers —
enforced at both app and RLS layers). No column was added to `guide_profiles`, so
the frozen `search_guides` rowtype is untouched. Public catalog, matching, and
existing bookings/messages are unchanged.

## One-line principal-engineer decisions

- **Reuse `is_available`, add zero columns to `guide_profiles`** — dodges the frozen
  `guide_search_result_row` (error 42804) landmine; audit lives in a separate table.
- **Task 5 tested via a pure `buildGuideApprovalUpdate(existing, guideId)` helper**
  instead of mocking the 6-table `performModerationAction` chain — smaller, robust,
  and it tests the exact branching logic (first-approval publishes, re-approval
  leaves `is_available` alone). *(Divergence from the plan's inline-mock test; simpler + safer.)*
- **Did NOT run `bun run db:reset` / `bun run types`** — the shared local Supabase is
  bound to a *different parallel job's* project (`pvd-agent-fix-missing-alert-dialog`);
  resetting it would clobber that job. Clients are untyped (no `Database` generic), so
  typecheck passes without regenerating types. Type regen is an operator/local step (below).

## Self-critique answers

- **Would a senior staff engineer approve this?** Yes — smallest reversible surface,
  identity from session, RLS backstop for the app gate, audit trail, no schema risk.
- **Does this scale?** Binary pause is O(1); audit table is indexed `(guide_id, created_at desc)`.
  A weekly-schedule engine is deliberately deferred (no time-slot booking model to consume it).
- **Is there a simpler path?** The pure helper for Task 5 is the simplification; everything
  else is already at the minimum (one 2-function service, reused UI idioms).
- **What breaks first under pressure?** The audit insert — intentionally best-effort
  (wrapped in try/catch + Sentry) so a logging failure never blocks the toggle itself.

## Files changed

Product code:
- `src/lib/supabase/availability.ts` (new) — `setOwnAvailability` / `setGuideAvailabilityByAdmin` + private `writeAvailability` with best-effort audit insert.
- `src/features/guide/actions/setAvailability.ts` (new) — guide self-service server action.
- `src/features/guide/components/profile/guide-availability-toggle.tsx` (new) — guide toggle UI (GlassCard + Button, no custom CSS).
- `src/app/(protected)/guide/profile/page.tsx` — select `is_available`; render toggle when `verification_status === "approved"`.
- `src/app/(protected)/admin/guides/[id]/actions.ts` — new `setGuideAvailability` route action.
- `src/app/(protected)/admin/guides/[id]/guide-availability-control.tsx` (new) — admin override UI (useActionState + formAction + .bind).
- `src/app/(protected)/admin/guides/[id]/page.tsx` — render "Доступность" card (`detail.profile.is_available` already available via `select("*")`).
- `src/lib/supabase/moderation.ts` — extract `buildGuideApprovalUpdate`; reject hides, approve only publishes on FIRST approval.
- `src/features/guide/offer-actions.ts` — select `is_available`; block paused guides from submitting new offers.

Tests:
- `src/lib/supabase/availability.test.ts` (new, 3)
- `src/features/guide/actions/setAvailability.test.ts` (new, 2)
- `src/features/guide/components/profile/guide-availability-toggle.test.tsx` (new, 2)
- `src/app/(protected)/admin/guides/[id]/actions.test.ts` (+2)
- `src/app/(protected)/admin/guides/[id]/guide-availability-control.test.tsx` (new, 2)
- `src/app/(protected)/admin/guides/[id]/page.test.tsx` (+1 mock export — fixes cross-file pollution)
- `src/lib/supabase/moderation.test.ts` (+2, `buildGuideApprovalUpdate`)
- `src/features/guide/offer-actions.test.ts` (+1, approved-but-paused)

## Migrations authored (NOT applied to prod)

1. `supabase/migrations/20260708120000_guide_availability_events.sql` — append-only audit
   table + RLS (`_select`: own-or-admin; `_insert`: self-as-actor-and-guide or admin) + index.
2. `supabase/migrations/20260708120001_guide_offers_insert_requires_available.sql` — replaces
   `guide_offers_insert`, adding `AND gp.is_available = true` while preserving the prior
   `account_status = 'active'` and `is_admin()` conditions from `20260702143000_...`.

## Commands run — results

| Gate | Command | Result |
|---|---|---|
| Targeted tests | `bun run test:run <8 spec files>` | ✅ all pass |
| Typecheck | `bun run typecheck` | ✅ exit 0 |
| Lint | `bun run lint` | ✅ 0 errors (21 pre-existing warnings, all in `src/data/**`, none in new files) |
| Full suite | `bun run test:run` | ✅ 223 files, 1136 tests pass |
| Build | `bun run build` | ✅ Compiled successfully, 60/60 static pages |

(`bun install` was required first — the fresh checkout had no `node_modules`.)

## Unresolved blockers / notes

- **No product-code blocker.** All gates green.
- `bun run db:reset` / `bun run types` deliberately skipped (shared local Supabase owned by
  another job). Section 5.2 SQL/RLS checks and 5.3 Playwright were not run for the same
  reason (no isolated running app/DB in this checkout). Logic is covered by mocked unit tests.

## For Hermes / operator (push + deploy + DB)

1. **Push** branch `feature/guide-availability-controls-20260708` (not pushed per packet).
2. **Prod DB applies, in order** (per `.claude/checklists/hand-edit-flow.md`):
   1. Pending backfill `20260702000001_publish_approved_guides.sql` — standing bug: approved
      guides stay hidden until this lands, so the toggle would have nothing to reveal.
   2. `20260708120000_guide_availability_events.sql` (audit table).
   3. `20260708120001_guide_offers_insert_requires_available.sql` (offer RLS gate).
3. **Local/preview:** run `bun run db:reset && bun run types` on an isolated Supabase and
   commit the regenerated `database.types.ts` (additive `guide_availability_events` block).
4. **Verify (SHIP_GATE, 1280px + 375px):** guide pause → absent from `/guides`; admin override;
   in-progress booking/inbox still loads; paused guide blocked from new offer. Watch Sentry
   `guide-availability-event` for 30 min.

## Method evidence

- **Context7** — `/vercel/next.js` (Server Actions mutate-then-`revalidatePath` from `next/cache`,
  `useActionState` + `formAction`) and `/supabase/supabase` (RLS `with check ((select auth.uid()) = col)`,
  boolean-gated `select` policy, service-role bypass). Both confirm the service/action/RLS shapes used.
- **Ponytail** — reuse `is_available` (no enum, no new column); one 2-function service; reused
  `GlassCard`/`Button`/`useActionState`; pure helper for Task 5; audit insert best-effort. No new deps.
- **Superpowers** — TDD per task (failing test → impl → green); verification-before-completion
  (every claim above is backed by a command result, not asserted).
