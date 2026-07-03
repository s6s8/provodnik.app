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
| 1 | Enforce boundaries + remove safe dead code | ✅ done (query-key factory deferred) |
| 2 | Data-layer consolidation per domain | ✅ substantially done (browser-write rewrite deferred) |
| 3 | RLS / security hardening | ✅ core done (R-04/R-06 deferred with plans) |
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

### Phase 1 — done

- **Boundary gate** (`chore(boundaries)`): warn-level `no-restricted-syntax` forbidding
  `.from(`/`.rpc(` + supabase client imports in `src/data`/`src/components`; 79 offenders
  grandfathered into `.eslint-baseline.json`; `lint:ratchet` wired into CI. Proven to bite
  (a new `.from()` in `src/data` fails the ratchet).
- **SAFE-NOW deletions** (`chore(cleanup)`, all grep-proven 0 non-test importers): dead
  card/traveler/discovery component clusters, `features/quality`, 9 unused shadcn
  primitives (+ tests); 4 dead deps (fontsource ×3, react-query-devtools); 6 zero-reader
  flags + orphaned `ROUTES.search`; root clutter archived via `git mv`.
- **Deferred**: query-key factory (G5) — low value without a full callsite migration
  (medium blind-risk); the ratchet already prevents new drift. Left for Phase 4 tag work.
- **Verified**: typecheck ✅, lint ✅, ratchet ✅, `test:run` ✅ 1086, build ✅.

### Phase 2 — substantially done

- **Collapsed dead triple-layered I/O** (`refactor(data)`): removed the superseded
  `src/data/{reviews,guide-offer,notifications}/supabase.ts` + `marketplace-events/client.ts`
  (0 non-test consumers — the live lifecycle is served by `src/lib/supabase/*` and
  `src/lib/notifications/*`). Static schema/types/demo siblings kept.
- **Relocated query I/O to canonical layer** (`refactor(data)`): `data/supabase/queries.ts`
  + `queries/core.ts` → `src/lib/supabase/{queries,queries-core}.ts` with a re-export shim
  (~44 importers unchanged). Static `lib/data/countries.ts` → `src/data/countries.ts`.
- **Result**: `src/data` Supabase-I/O boundary warnings 79 → 21 (8 mislocated modules → 2);
  ratchet floor lowered to 21 to lock the monotonic decrease.
- **Deferred (documented) — R-05 ADAPTER-REWRITE**: `data/guide-assets/supabase-client.ts`
  and `data/guide-templates/supabase-client.ts` are `createSupabaseBrowserClient` modules
  doing **browser writes** (uploads/reservations/deletes). The correct fix is
  server-action + presigned upload (pattern already exists in `src/lib/storage/upload.ts`
  + `features/guide/verification-actions.ts`), which changes the client call contract
  (sync browser call → async server action) and MUST be parity-verified via the browser
  E2E net — an operator step in this sandbox. A cosmetic relocate would mask the
  trust-boundary debt, so these are left in `src/data` where the boundary rule keeps
  flagging them. **Next action**: with the seeded E2E stack up, rewrite each browser
  write to a server action returning `ActionResult`, move the read helpers to
  `lib/supabase/{guide-assets,guide-templates}.ts`, and add parity tests before deleting
  the browser client usage.
- **Verified**: typecheck ✅, lint ✅, ratchet ✅, `test:run` ✅ 1080, build ✅.

### Phase 3 — RLS / security hardening (core done)

- **R-07 business_leads** (`fix(security)`): replaced the `WITH CHECK (true)` anon insert
  with a shape-constrained policy. No app path inserts into this table, so only the
  direct-API spam vector is closed. + pgTAP (valid insert ok; empty contact / oversized
  note / out-of-range headcount rejected).
- **R-08 storage buckets** (`fix(security)`): additive migration declaring all 6 buckets
  + their `public` flag (source: `src/lib/storage/buckets.ts` + `guide_portfolio_public_read`);
  publicness is now reproducible, not environment-drift. Idempotent (on-conflict reconciles
  only `public`). + pgTAP asserting private/public flags.
- Both migrations **validated against the live baseline schema in a rolled-back
  transaction** (syntax + object refs + resulting policy/flags), plus rollbacks.
- **R-03 (traveler_requests PII)**: already closed by the launch fix
  (`v_public_open_requests` + tightened `traveler_requests_select`) and covered by
  `public_launch_hardening_test.sql` + `request_display_rls_test.sql` (this branch added
  the non-owner booking assertions). Verified.
- **R-09 (SECURITY DEFINER tests)**: already present
  (`security_definer_rpc_identity_test.sql`, `transactional_write_rpcs_test.sql`).
- **Deferred — R-06 (`/api/requests/parse` auth)**: this is the **guest** homepage AI
  request parser (north-star entry: a traveler posts a request without an account). It is
  already guarded by IP rate-limit (20/min) + a global LLM budget. Hard auth breaks guest
  UX; the sanctioned fix is a signed-token (server issues a short-lived HMAC token embedded
  in the homepage, client sends it as a header, route validates HMAC + freshness, rate/
  budget kept). That changes the homepage form contract and MUST be verified against the
  live guest flow in a browser (operator step here). **Next action**: add `PARSE_HMAC_SECRET`
  env, issue the token in the homepage RSC, send + validate it, keep the existing caps.
- **Deferred — R-04 (admin RLS read-backstop)**: additive `is_admin()` SELECT policies are
  safe (they only grant admins), but admin surfaces read via a service-role client that
  bypasses RLS, so the policies are latent defense-in-depth of marginal current value, and
  correctness across ~15 admin tables cannot be exercised without the admin E2E net (an
  operator step here). Non-admin denial is already test-proven (`role_escalation_test.sql`).
  **Next action**: with the admin E2E net running, add `is_admin()` SELECT policies
  table-by-table behind pgTAP (admin authed-client can read; non-admin denied), keeping
  service-role for legitimate bypass writes.
</content>
</invoke>
