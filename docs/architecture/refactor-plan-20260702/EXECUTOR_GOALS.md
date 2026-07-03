# EXECUTOR_GOALS.md — dispatchable `/goal` packets

Ordered, bounded, independently-verifiable task packets for **later, separate** dispatches (one at a time).
Each is non-destructive, has a stop condition, exact verification commands, and expected artifacts.
Product-code executor is **QuantumHands** per project rules; Claude plans/reviews. **Do not batch.**

Global verify chain (definition of done): `bun run typecheck && bun run lint && bun run test:run &&
bun run playwright && bun run build`. UI goals also verify at 1280px and 375px with clean console.
Never push; commit only and report hash.

---

## G0 — Playwright role fixtures + un-skip critical-flow E2E  *(Phase 0, blocking)*
**Goal:** Add a Playwright `setup` project that authenticates traveler/guide/admin and writes per-role
`storageState`; convert `tests/e2e/tripster-v1/01–06` from skip-by-default to real, asserting tests for
request→offer→accept→booking→review→dispute; fix ERR-059 spec rot (creds/testids).
`/goal Do not stop until the role-based E2E lifecycle suite runs non-skipped and green.`
**Scope:** `tests/`, `playwright*.config.ts`, seed helpers only. No product code.
**VERIFY:** `bun run playwright` runs the suite with **0 skipped** in the lifecycle project and passes;
CI config fails if these specs are skipped.
**Artifacts:** `playwright/.auth/{traveler,guide,admin}.json` generation, updated configs, green suite.

## G1 — RLS / authorization test harness  *(Phase 0, blocking)*
**Goal:** Add DB-level authorization tests (pgTAP or Supabase test project) asserting: anon cannot read
PII columns of `traveler_requests`; non-owner cannot read others' `bookings`/`guide_offers`; non-admin is
denied admin-scoped reads; suspended account is locked out.
`/goal Do not stop until RLS tests prove the anon/non-owner/non-admin denials on a fresh db:reset.`
**Scope:** `supabase/tests/` (new), test scripts. No policy changes yet.
**VERIFY:** `supabase db reset` + test run: all authorization assertions pass; a deliberately-loosened
policy makes them fail (proves they bite).
**Artifacts:** RLS test suite + a documented current-baseline (which assertions pass/fail today).

## G2 — `ActionResult` contract tests  *(Phase 0)*
**Goal:** Add unit tests pinning `src/lib/actions/create-action.ts` behavior (success/error/validation
shapes) so later migration is safe.
`/goal Do not stop until createAction has full-branch test coverage.`
**VERIFY:** `bun run test:run` covers success, thrown-error, and zod-failure branches of `createAction`.
**Artifacts:** `create-action.test.ts` expanded.

## G3 — Data-layer lint gate (ratcheted)  *(Phase 1)*
**Goal:** Add eslint rules forbidding `createSupabaseServerClient`/`createBrowserClient`/`.from(`/`.rpc(`
inside `src/data/**` and `src/components/**`; seed `.eslint-baseline.json` so the 8 known offenders are
grandfathered and no new violation can land.
`/goal Do not stop until lint blocks new data-layer violations while existing ones are baselined.`
**VERIFY:** `bun run lint` passes on current tree; adding a `.from()` to any `src/data` file fails lint.
**Artifacts:** eslint rule + updated baseline; short README note.

## G4 — Delete SAFE-NOW dead code + dead deps  *(Phase 1)*
**Goal:** Remove the provably-unused components (`components/cards/*`, dead `components/traveler/*`, dead
`components/discovery/*`, `features/quality`, 9 unused shadcn primitives), 4 zero-usage deps, and 6
zero-reader flags + orphaned ROUTES/nav entries. `git mv` root clutter (`audits/`, `task-audit-2026-07-01/`,
stale root `DECISIONS.md`) to an archive dir — do not hard-delete tracked files.
`/goal Do not stop until dead code/deps are removed with grep-proven 0 imports and the build is green.`
**VERIFY:** for each deletion, `grep -r` import count = 0 before removal; `bun run typecheck && lint &&
test:run && build` green; bundle size decreases.
**Artifacts:** deletion commit with per-item grep evidence in the message/PR body.

## G5 — Query-key factory + populate `features/shared`  *(Phase 1)*
**Goal:** Add `src/lib/query-keys.ts` factory; replace inline TanStack key arrays; move genuinely shared
cross-feature components into `features/shared` and repoint the `requests↔guide` (11) / `traveler↔requests`
(4) cross-imports through it.
`/goal Do not stop until no inline query-key arrays remain and cross-feature imports go via features/shared.`
**VERIFY:** grep finds 0 inline `queryKey: [` outside the factory in migrated areas; lint boundary rule
green; flows still pass E2E.
**Artifacts:** `query-keys.ts`, populated `features/shared`, updated imports.

## G6 — Migrate one data domain to `lib/supabase/` (repeatable template)  *(Phase 2)*
**Goal:** Move ONE mislocated I/O module (start with `data/supabase/queries.ts`, then reviews →
notifications → guide-offer → guide-assets → guide-templates → marketplace-events) into
`src/lib/supabase/<domain>.ts` with a typed client arg; old path re-exports until callers move.
`/goal Do not stop until <domain> I/O lives in lib/supabase, old path re-exports, and parity tests pass.`
**Scope:** exactly one domain per dispatch.
**VERIFY:** domain data tests + related E2E green; `.from(` count in `src/data` decreases; no behavior diff;
verify chain green.
**Artifacts:** new service module, re-export shim, tests.

## G7 — `traveler_requests` PII-safe public exposure  *(Phase 3)*
**Goal:** Replace the public SELECT that exposes traveler_id/notes/budget with a PII-safe view or policy for
anon; full row only to authenticated members/bidders. Additive migration (add new, verify, remove old later).
`/goal Do not stop until anon reads of traveler PII are blocked and RLS tests prove it.`
**VERIFY:** G1 RLS suite: anon PII assertions now pass; public `/requests` still renders non-PII cards;
authenticated bidder still sees full detail.
**Artifacts:** additive migration + updated RLS tests + `/requests` still green in E2E.

## G8 — Close anon-insert & unauth-endpoint surfaces  *(Phase 3)*
**Goal:** Constrain `business_leads` anon `WITH CHECK (true)`; add auth/signed-token to `/api/requests/parse`
while keeping rate-limit + budget; seed storage buckets + policies in migrations.
`/goal Do not stop until anon spam-insert and unauth LLM abuse paths are closed with tests.`
**VERIFY:** RLS/route tests prove the new constraints; legitimate lead capture + request parsing still work.
**Artifacts:** migration(s) + route guard + tests.

## G9 — Admin RLS read-backstop  *(Phase 3)*
**Goal:** Add `is_admin()`-based RLS read policies so admin surfaces have a DB backstop, reducing sole
reliance on the soft proxy + service-role client. Keep service-role only where a legitimate RLS bypass is needed.
`/goal Do not stop until admin reads are policy-gated and non-admin denial is test-proven.`
**VERIFY:** G1 suite: non-admin denied; admin console still fully functional in E2E.
**Artifacts:** admin RLS policies + tests.

## G10 — Migrate actions to `ActionResult` (per-domain)  *(Phase 4)*
**Goal:** Adopt `createAction`/`ActionResult` for ONE feature's actions at a time; share Zod schema
between action + RHF; add `revalidateTag` per domain; adopt `useActionState`/`useOptimistic` in the form.
`/goal Do not stop until <feature> actions use ActionResult with shared Zod and green tests.`
**VERIFY:** action tests + form E2E green; return-shape uniform in the migrated feature.
**Artifacts:** migrated actions/forms + tests; adoption metric updated.

## G11 — Merge homepage variants  *(Phase 5, flag-guarded)*
**Goal:** Consolidate `features/homepage` + `features/homepage-classic` into one `homepage` feature with
`/ai` as a variant; keep behavior identical; guard behind an existing flag.
`/goal Do not stop until one homepage feature serves / and /ai with identical behavior behind a flag.`
**VERIFY:** home + `/ai` E2E green at 1280px & 375px; flag off restores prior module instantly.
**Artifacts:** merged feature + flag + E2E.

## G12 — Decompose god components + consolidate cards  *(Phase 5)*
**Goal:** Split `request-detail-screen` (1013), `booking-detail-screen` (984), `bid-form-panel` (639),
`guide-excursions-screen` (593), `public-requests-marketplace-screen` (520) into sub-components/hooks;
consolidate the surviving card variants into one shared set.
`/goal Do not stop until each target file is decomposed with component tests green and no visual regression.`
**VERIFY:** component tests + visual walkthrough at 1280px & 375px; no behavior change.
**Artifacts:** decomposed components + tests.

## G13 — Terminology unification (copy-only)  *(Phase 5, needs owner glossary)*
**Goal:** After owner picks canonical nouns (sellable-unit, demand-unit, guide-response, brand), apply a
copy-only sweep; add redirects for any route rename.
`/goal Do not stop until UI copy uses the agreed glossary consistently with redirects for renamed routes.`
**VERIFY:** grep shows single canonical noun in UI copy; no dead links; redirects resolve; E2E green.
**Artifacts:** copy sweep + redirects + updated glossary doc.

---

### Recommended dispatch order
G0 → G1 → G2 (unlock) → G3 → G4 → G5 → then G6 repeated per domain → G7 → G8 → G9 → G10 per feature →
G11 → G12 → G13. **G0 and G1 gate everything; do not start Phase 2+ code motion until both are green.**
