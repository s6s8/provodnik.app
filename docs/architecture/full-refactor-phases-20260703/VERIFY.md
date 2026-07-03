# VERIFY — commands run and results

All commands run in `/private/tmp/provodnik-opus-full-refactor` on branch
`opus/full-refactor-phases`.

## Baseline (@ 0385b826)

| Command | Result |
|---|---|
| `bun install --frozen-lockfile` | ✅ 1020 packages |
| `bun run typecheck` | ✅ 0 errors |
| `bun run lint` | ✅ 0 problems |
| `bun run test:run` | ✅ 227 files / 1129 tests |
| `NEXT_TELEMETRY_DISABLED=1 bun run build` | ✅ all routes built |

## Phase 0 — safety net

| Command | Result |
|---|---|
| `bunx vitest run src/lib/actions/create-action.test.ts` | ✅ 7 tests (was 4) |
| `bun run typecheck` | ✅ 0 errors |
| `bun run lint` | ✅ 0 problems |
| `bun run test:run` | ✅ 227 files / 1132 tests |
| `bunx playwright test --list` | ✅ 16 tests across 5 files compile + discovered |

### Not executed in-sandbox (wired + documented; runs in CI / operator)

- `bun run test:db` (pgTAP RLS suite) — sandbox shares another job's Supabase stack
  (project `pvd-agent-fix-missing-alert-dialog`, same `project_id`); its schema lacks
  this branch's migrations and pgTAP, and `db reset`/`push` would clobber that job.
  Now runs in CI `db-tests` on an isolated `supabase db start` stack.
- `bun run playwright` (browser E2E lifecycle) — needs seeded QA accounts
  (`bun scripts/seed-test-users.mjs <env>` with `QA_SEED_PASSWORD`) + a running app.
  Role-fixture setup project + honest specs are in place; live green is the operator step.
</content>
