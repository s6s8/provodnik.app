# /goal — Provodnik full phased cleanup/refactor execution

You are Claude Opus working in `/tmp/provodnik-opus-full-refactor` on branch `opus/full-refactor-phases`.

You start from commit `0385b826`, which already includes the launch-readiness fixes. Your job is to execute the whole refactor/cleanup plan phase by phase, safely and with verification, without losing functionality.

## Standalone slash goal to follow

`/goal Do not stop until every feasible phase from docs/architecture/refactor-plan-20260702/REFACTOR_PLAN.md has either been implemented, independently verified, and committed, or explicitly classified as blocked with concrete evidence, a safe partial commit, and exact next action. Work phase by phase. Never skip the safety net. Never weaken RLS/security. Never delete functionality. Do not push or deploy.`

## Source of truth to read first

Read these before editing:

1. `AGENTS.md`
2. `CLAUDE.md` if present
3. `.claude/CLAUDE.md` if present
4. `.claude/sot/INDEX.md`, `HOT.md`, `ERRORS.md`, `ANTI_PATTERNS.md`, `DECISIONS.md`, `PATTERNS.md` if present
5. `docs/architecture/refactor-plan-20260702/REFINED_PROMPT.md`
6. `docs/architecture/refactor-plan-20260702/APP_INVENTORY.md`
7. `docs/architecture/refactor-plan-20260702/REFACTOR_PLAN.md`
8. `docs/architecture/refactor-plan-20260702/RISK_REGISTER.md`
9. `docs/architecture/refactor-plan-20260702/EXECUTOR_GOALS.md`
10. `docs/architecture/refactor-plan-20260702/CONTEXT7_NOTES.md`
11. `docs/qa/launch-readiness-fix-20260702/FIX_SUMMARY.md`
12. `docs/qa/launch-readiness-fix-20260702/VERIFY.md`

Use Context7 before changing code that depends on current behavior for:
- Next.js App Router / Server Actions / redirects / caching/revalidation;
- Supabase SSR, RLS, RPC, typed clients, pgTAP/Supabase testing;
- Playwright projects/storageState where E2E is touched;
- React 19 patterns if UI/form behavior changes.

## Product north star and PM/MVP decision policy

If a question comes up, answer it yourself as PM/MVP unless it is a true legal/payment/secret/irreversible production decision.

North star:
- Provodnik is demand-first: the traveler posts a request, guides respond with offers, other travelers may join.
- Ready-made excursions exist but are the third model, not the center.
- V1 is money-less: discovery, request capture, group assembly, guide offer, booking confirmation, review, moderation/support/dispute.
- Preserve role boundaries: traveler / guide / admin.
- Preserve public/private data boundaries and RLS as the security source of truth.
- Prefer small reversible steps, compatibility adapters, and tests before motion.

Default PM terminology decisions unless repo SOT says otherwise:
- `путешественник`, not `клиент`/`турист` in product UI.
- `гид`, not `поставщик`/`исполнитель`.
- `запросы`, not `биржа`.
- `готовые экскурсии`, not `готовые туры`.
- `отклик гида` / `предложение гида` for guide response; keep DB names stable.
- Do not rename routes for terminology unless redirects and link tests are included.

## Global hard constraints

- Do not push.
- Do not deploy.
- Do not print secrets or write secrets into files.
- Do not mutate production DB. Migrations are okay as files; live apply is out of scope.
- No big-bang rewrite. Use strangler/adapter pattern.
- Do not delete code until import/search proof and tests make it safe.
- Do not change user-visible behavior except planned terminology cleanup or replacing broken/stub behavior with useful V1 behavior.
- Keep request-first flow and role-specific security intact.
- Keep Tailwind/shadcn style rules: no custom CSS classes, no style blocks, no inline layout style.
- Commit phase-by-phase with human commit messages, no automation attribution trailers.
- Maintain `docs/architecture/full-refactor-phases-20260703/PROGRESS.md` after every phase/task.

## Execution model

Work through the phases in order. Each phase has:
1. Plan slice — identify exact files and risks.
2. Regression tests first where feasible.
3. Minimal implementation.
4. Verification.
5. Commit.
6. Progress report.

If a phase is too big, split it into smaller commits by domain. Do not hold a massive dirty diff across phases.

## Required phases

### Phase 0 — Safety net, blocking prerequisite

Implement the safety net before deep code motion:

- Make critical lifecycle E2E real and not green-by-construction:
  - request create;
  - guide offer;
  - traveler accept;
  - booking detail;
  - review;
  - dispute;
  - role gate denials.
- Add role fixtures/storageState for traveler/guide/admin if missing.
- Add RLS/authorization tests for at least:
  - anon cannot read traveler PII;
  - non-owner cannot read others’ bookings/offers;
  - non-admin cannot read admin-scoped data where RLS backstop exists;
  - suspended account lockouts / guide public visibility invariants from recent fixes.
- Add ActionResult/createAction contract tests before any action migration.

Acceptance gate:
- The new E2E/RLS/contract tests are not skipped by default.
- Existing tests remain green.
- If external seeded auth credentials block browser E2E, create deterministic local seed/test harness and document remaining live-only step.

### Phase 1 — Enforce boundaries and remove safe dead code

- Add lint/ratchet guard so no new Supabase I/O appears in forbidden layers.
- Add query-key/tag taxonomy foundation if low-risk.
- Delete or archive SAFE-NOW dead code from the plan only after import-count proof.
- Remove unused deps only after package usage proof.
- Archive root clutter via `git mv`, not `rm`, if tracked and historically useful.
- Remove permanently-off zero-reader flags only if proof shows no reader and tests pass.

Acceptance gate:
- Boundary rule prevents new drift without breaking baseline.
- Import/search proof documented.
- Full checks pass.

### Phase 2 — Data-layer consolidation, one domain at a time

Move mislocated Supabase I/O modules into intended service modules using compatibility re-exports first. Priority:
1. `data/supabase/queries.ts` split into domain service modules.
2. reviews / notifications triple-layer collapse.
3. request/open-request/public-request service boundaries.
4. guide-offer service cleanup.
5. guide-assets / guide-templates browser writes → server action + presigned pattern.
6. marketplace-events/countries static-location cleanup.

Acceptance gate per domain:
- Parity tests before/after.
- `grep` count of `.from(` in forbidden layers decreases monotonically.
- Routes relying on that domain still pass smoke/unit tests.

### Phase 3 — RLS/security hardening

Implement security hardening from risk register unless already solved:
- admin read RLS backstop where feasible;
- public traveler request PII exposure hardened (may already be covered by launch fix — verify and extend);
- constrain `business_leads` anon insert or route via safe RPC;
- auth/signed-token gate for `/api/requests/parse` while preserving V1 UX;
- storage bucket/policy migrations so public/private storage config is reproducible;
- add tests around SECURITY DEFINER functions before touching them.

Acceptance gate:
- RLS tests prove denials and allowed paths.
- Existing product flows still work.
- Migrations are additive-first and safe.

### Phase 4 — Server actions/forms standardization

- Introduce/expand `createAction`/`ActionResult` adoption domain-by-domain.
- Keep old signatures/adapters until callers move.
- Share Zod schemas between server actions and RHF resolvers where feasible.
- Add revalidation/tag usage for changed domains.

Acceptance gate:
- Contract tests pass.
- Migrated forms preserve success/error behavior.
- No broad rename without tests.

### Phase 5 — UI decomposition + terminology cleanup

- Decompose god components incrementally behind tests.
- Consolidate duplicate cards/components using existing shadcn/Tailwind rules.
- Apply terminology glossary to product UI copy.
- Keep legal pages legally clear; do not blindly replace legal terms.
- Keep routes stable unless redirects and link tests are added.

Acceptance gate:
- Component tests + visual smoke for desktop/mobile where possible.
- No horizontal overflow at mobile width for touched screens.
- No forbidden product terms in user-visible non-legal UI unless justified in progress notes.

## Required verification commands

Run the relevant targeted checks after each phase, and before final completion run:

```bash
bun install --frozen-lockfile
bun run typecheck
bun run lint
bun run test:run
NEXT_TELEMETRY_DISABLED=1 bun run build
```

If E2E/DB tests are added, also run their project commands. If a command does not exist, add the proper script or document the exact reason and use the direct command.

For browser/product checks, use local production build when feasible, not only dev mode. Capture screenshots for changed user-visible screens under:

`docs/architecture/full-refactor-phases-20260703/screenshots/`

## Required artifacts

Create/update:

1. `docs/architecture/full-refactor-phases-20260703/PROGRESS.md`
   - phase checklist, current status, commits, verification results, blockers.
2. `docs/architecture/full-refactor-phases-20260703/DECISIONS.md`
   - PM/MVP decisions made without asking the owner, with rationale.
3. `docs/architecture/full-refactor-phases-20260703/VERIFY.md`
   - exact commands run and results.
4. `docs/architecture/full-refactor-phases-20260703/RISK_NOTES.md`
   - what risks were reduced, deferred, or blocked.
5. `docs/architecture/full-refactor-phases-20260703/FINAL_REPORT_RU.md`
   - sanitized Russian owner-facing report: short bullets, no local paths, no internal tooling/model names, no secrets.

## Commit policy

Commit after each verified phase or coherent subphase:
- `test(e2e): add role lifecycle safety net`
- `chore(boundaries): prevent new data-layer drift`
- `refactor(data): consolidate public request services`
- `fix(security): add admin read policy backstop`
- etc.

No attribution trailers. No push.

## If blocked

Do not spin forever. A valid blocker requires:
- exact phase/subtask;
- evidence;
- what was attempted;
- safe partial state;
- next command/action for the human/operator;
- all independent checks run.

Then commit any safe completed work and document the blocker.

## Final return contract

When done, return:
- final branch and HEAD commit;
- phase completion table;
- commits created;
- verification status;
- known blockers/deferred items;
- recommended next operational step: review/PR/migration/deploy/live smoke.
