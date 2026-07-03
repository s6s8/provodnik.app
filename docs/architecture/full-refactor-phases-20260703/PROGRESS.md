# PROGRESS — Provodnik full phased refactor

Branch: `opus/full-refactor-phases` · Base: `0385b826` (launch-readiness fixes).
Execution of `docs/architecture/refactor-plan-20260702/REFACTOR_PLAN.md`, phase by phase.

## Baseline (before any change)

| Gate | Result |
|---|---|
| `bun install --frozen-lockfile` | ✅ 1020 packages |
| `bun run typecheck` | ✅ 0 errors |
| `bun run lint` | ✅ 0 errors |
| `bun run test:run` | ✅ 227 files / 1129 tests |
| `NEXT_TELEMETRY_DISABLED=1 bun run build` | ✅ all routes built |

## Sandbox constraints (affect what can be executed vs only wired)

- A local Supabase stack is running but is **owned by a parallel job** (project
  `pvd-agent-fix-missing-alert-dialog`, shared `project_id`). `db reset`/`db push`
  would clobber that job → **forbidden**. Its schema also lacks this branch's
  migrations and pgTAP, so this branch's pgTAP suite cannot be run against it.
- Therefore DB (pgTAP) and browser E2E are **wired into runnable gates (script + CI
  job on an isolated stack) and documented**, but not executed live in this sandbox.
  Everything else (typecheck / lint / vitest / build / grep proofs) is executed here.

## Phase status

| Phase | Title | Status |
|---|---|---|
| 0 | Safety net (E2E + RLS + contract tests) | ✅ done (DB/E2E live-run = operator step) |
| 1 | Enforce boundaries + remove safe dead code | pending |
| 2 | Data-layer consolidation per domain | pending |
| 3 | RLS / security hardening | pending |
| 4 | Server actions / forms standardization | pending |
| 5 | UI decomposition + terminology | pending |

## Log

- Read all SOT + plan docs. Baseline verified green. Assessed Phase 0: the
  launch-readiness work already shipped 11 pgTAP RLS files (~96 assertions) and a
  `createAction` contract test, but **none run in CI** (CI = typecheck/lint/build only)
  and there is no `test:db` script — that is the primary Phase 0 gap.

### Phase 0 — done

- **Wired the safety net into real gates** (the core gap): `.github/workflows/ci.yml`
  now runs `bun run test:run` + `bun run build` in `quality`, and a new `db-tests` job
  boots an isolated Supabase (`supabase db start` → applies migrations) and runs the
  full pgTAP suite via a new `test:db` script (`supabase test db`). The RLS suite is now
  a non-skipped PR gate, not a live-only afterthought.
- **createAction contract tests** hardened: added context-tag propagation, non-object /
  null payload rejection, and coerced-input branches (`create-action.test.ts`, 7 tests).
  Pins the wrapper before the Phase 4 action migration.
- **RLS coverage** extended: `request_display_rls_test.sql` now also asserts non-owner
  travelers and unrelated guides cannot SELECT another party's booking (plan 6 → 8).
- **Playwright role fixtures**: new `auth.setup.ts` setup project writes per-role
  `storageState` (real when seeded, valid empty stub otherwise); config gains a `setup`
  project + dependency. Deterministic seed harness already exists
  (`scripts/seed-test-users.mjs` → the `qa-*` accounts in `fixtures.ts`).
- **De-rotted E2E**: deleted the 6 skip-by-default, green-by-construction `tripster-v1/01–06`
  specs (ERR-059: legacy direct-book UI, invented selectors, mid-test `test.skip()` escape
  hatches). Replaced with `tripster-v1/lifecycle.spec.ts` (request-first, real assertions,
  no escape hatches, gated on `E2E_READY`) and `role-gate-denials.spec.ts` (anon denied on
  `/trips`, `/guide/profile`, `/admin`, `/bookings/*` — real, seed-free).
- **Verified**: typecheck ✅, lint ✅, `test:run` ✅ 1132 tests, `playwright --list` ✅ 16
  tests compile/discover. DB pgTAP + browser E2E live-run remain the operator step
  (sandbox shares another job's Supabase stack; see constraints above).
</content>
</invoke>
