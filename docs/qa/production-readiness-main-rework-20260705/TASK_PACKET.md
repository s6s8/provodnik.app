# Production-readiness main rework — 2026-07-05

Owner instruction: finish the website. Do not leave the previously completed audit branch blocked on conflicts. Rework the verified fixes from `handover/prod-readiness-fixes` onto current `origin/main`, commit, push, open/merge PR, deploy VPS if checks allow, and write a final report.

## Current branch
- Worktree: `/private/tmp/provodnik-prod-readiness-main-rework`
- Branch: `work/prod-readiness-main-rework-20260705`
- Base: current `origin/main` (`09dcb497` at task creation)

## Source branch / evidence
- Old fix branch: `/Users/idev/provodnik/.claude/worktrees/prod-readiness` / `handover/prod-readiness-fixes`
- Old PR: #265, blocked by 44 conflicts against main refactor.
- Full report from old branch: `/Users/idev/provodnik/.claude/worktrees/prod-readiness/docs/qa/production-readiness-fable-20260705-191343/FULL_COMPLETION_REPORT.md`
- Old important commits: `127599aa`, `6e2fb00c`, `d203f3a1`, `d2bfb7cc`, `cf4e88a4`, `388644e8`.
- Audit SOT: `docs/qa/production-readiness-fable-20260705-191343/ISSUES.md`, `issues.json`, `COVERAGE.md` from the old branch; copy any useful docs/artifacts into this branch under `docs/qa/production-readiness-main-rework-20260705/`.

## Mandatory strategy
Do not blind-merge conflict markers. Main has a newer data-layer refactor and `FEATURE_PUBLIC_CATALOG`; re-implement only the still-relevant fixes against main's current structure.

Use source branch diffs as a checklist:
1. Read old full report and old diff:
   - `git -C /Users/idev/provodnik/.claude/worktrees/prod-readiness show --stat 388644e8`
   - `git -C /Users/idev/provodnik/.claude/worktrees/prod-readiness show --name-only 388644e8`
   - targeted `git show` for files as needed.
2. For every PRD-001…035, decide: already present in main, port/rework needed, superseded by main, live-DB already applied, or impossible. Capture evidence.
3. Rework fixes onto current main. Prefer small commits grouped by area. No payment work. No secret output.
4. DB work: live DB mutations were reportedly already applied in the old pass. Verify via read-only introspection/REST if credentials/tooling allow; do not reapply blindly. If any target DB fix is missing and the SQL is safe/idempotent, apply targeted SQL with before/after evidence. Never run blind `supabase db push`.
5. For PRD-021, use main's `FEATURE_PUBLIC_CATALOG` gating if it solves the empty catalog problem; do not reintroduce obsolete redirect conflicts.
6. For PRD-034, adapt to the relocated query module in current main.
7. Keep docs/report artifacts useful but avoid huge stale screenshots or unrelated audit noise.

## Verification gates
Run and record actual results:
- `bun run typecheck`
- `bun run lint`
- `bun run test:run`
- `bun run build`
- `bun run playwright` if runnable; if specs are deliberately gated because they mutate production Supabase, prove that with config/spec evidence and run all non-mutating specs.
- local production HTTP/browser checks for representative fixed routes:
  - protected anon routes redirect to auth
  - legacy `/guide/{uuid}` redirects to canonical guide slug if data exists
  - `/destinations`/`/listings` do not show broken empty catalog surfaces under main's feature flag
  - OG/Twitter image route returns an image if implemented/needed
- DB verification for RLS/data fixes: policy definitions and anon REST probes; redact secrets.

## GitHub + deploy
- Commit all intended changes; worktree must be clean.
- Push branch to origin.
- Open PR against `main` with concise body and verification.
- If PR checks/mergeability allow, merge it. If checks fail, inspect and fix.
- Deploy VPS from merged `origin/main` using the established runbook: update `/opt/provodnik`, build, restart service, verify service active, Caddy active, and public HTTP/body on `https://vps.provodnik.app` key routes.
- If merge/deploy is impossible, final report must contain the exact external blocker and proof.

## Final report artifact
Write `docs/qa/production-readiness-main-rework-20260705/FINAL_REPORT.md` containing:
- summary
- per-PRD status 001…035 with evidence and commit/migration/DB state
- verification command results
- branch/PR/merge/deploy state
- live URL proof or blocker
- no secrets

Use Superpowers/Ponytail/Context7 discipline if available. Make PM decisions yourself; do not ask the owner.
