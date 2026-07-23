# E2E gating matrix

Playwright suites are split by credential and mutation risk. The default `bun run playwright` command is safe for CI and local smoke: it boots a production build on port 3000 and runs non-mutating specs.

## Prerequisites

| Variable | Purpose |
| --- | --- |
| `QA_SEED_PASSWORD` | Enables seeded login fixtures (`tests/e2e/auth.setup.ts`) |
| `E2E_ALLOW_MUTATIONS=1` | Opts into suites that create real rows in the target Supabase |
| `E2E_BASE_URL` | Skip local `webServer` boot and target an existing deployment |

## Disposable local stack for mutation suites

```bash
bun install --frozen-lockfile
bun run db:reset
bun scripts/seed-test-users.mjs .env.local
bun scripts/seed-qa-content.mjs .env.local
E2E_ALLOW_MUTATIONS=1 bun run playwright
```

Never run mutation suites against an unknown, shared, or production backend.

## Suite matrix

| Spec | Runs by default | Requires |
| --- | --- | --- |
| `request-first-smoke.spec.ts` | yes | none |
| `role-gate-denials.spec.ts` | yes | none |
| `tripster-v1/lifecycle.spec.ts` | no | `QA_SEED_PASSWORD` + `E2E_ALLOW_MUTATIONS=1` + seeded local Supabase |
| `wildberries-evidence.spec.ts` | no | `WB_EVIDENCE=1` + `QA_SEED_PASSWORD` |

The lifecycle suite covers request creation, guide inbox visibility, and traveler cabinet confirmation. Extend it only behind the same mutation gate.
