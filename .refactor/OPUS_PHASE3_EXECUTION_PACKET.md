# Opus Phase 3 execution packet — deslop/refactor completion

You are QuantumHands working in `/Users/idev/provodnik` on branch `refactor/deslop-20260707`.

## Owner instruction
The owner approved execution: analyze, create goal, dispatch Opus, do everything including DB updates if required, delete all approved dead/slop things, do not ask questions, do not stop until complete. Act as PM where judgment is needed. Preserve behavior; remove slop.

## Source documents
Read in full before edits:
- `.refactor/PLAN.md` — full Phase 2 plan, 6 batches, veto list, bugs, uncertain items.
- `.refactor/BASELINE.md` — Phase 0 safety net and baseline gates.
- `.refactor/quarantine/WIP-LEDGER.md` — previous preserved WIP/deferred items; owner now approved finishing/removing when proven safe.
- `.refactor/quarantine/data-favorites-active-user.ts` — quarantined WIP file.
- `docs/COMPONENT_AUDIT.md` — prior component-level audit.
- `AGENTS.md`, `CLAUDE.md`, `.claude/CLAUDE.md`, `.claude/rules/provodnik-orchestration.md`, and relevant SOT files.

## Mandatory tools / methods
- Use Superpowers: systematic-debugging, test-driven-development where behavior can regress, verification-before-completion.
- Use Ponytail for ruthless cleanup / laziness / anti-overengineering review.
- Use Context7 where framework/library behavior matters (Next app-router special files, React Compiler/memo, Supabase migration/RLS/database semantics).
- Use `bun`; never npm/yarn.

## Scope
Execute the refactor plan end-to-end:
1. Commit or preserve the `.refactor/` plan/baseline/ledger docs as source-of-truth artifacts.
2. Execute Batch 1–3 from `.refactor/PLAN.md`: zero-risk deletions, manifest pruning, exact-duplicate merges.
3. Execute Batch 4 semantic consolidation only where you can prove behavior preservation and gates pass; if a sub-batch is too broad for a single safe commit, split it into small verified commits and continue.
4. Batch 5 React Compiler memo modernization: execute selectively only where Context7 + tests make it safe; otherwise document exact deferral in the final report.
5. Batch 6 structural moves: execute safe obvious data-layering cleanups only when imports/tests prove behavior preservation; otherwise document exact deferral.
6. Owner explicitly approved uncertainty resolution: delete/quarantine WIP scaffolding if fresh proof shows 0 live references and it is not framework/DB-convention-loaded. Do not delete framework-magic or DB-convention-loaded items from the veto list.
7. Fix real bugs discovered by the plan if they are necessary for a clean, safe final state, including DB/migration updates. For DB: confirm Provodnik ref `yjzpshutgmhxizosbeef`, snapshot/probe before, apply targeted/idempotent/additive changes only, verify after, and never print secrets or raw PII.
8. Remove obsolete `.tmp`, stale generated audit leftovers, unused public SVGs, unused dependencies, stale env vars, and dead code/docs only after inventory and proof.
9. Finish Phase 4 report: create/update `.refactor/REPORT.md` with full evidence.

## Hard constraints
- Preserve behavior. This is subtraction/simplification, not redesign.
- Do not delete anything in the framework-magic VETO LIST unless you prove it is not actually convention-loaded.
- Every deletion must pass PROVE-BEFORE-DELETE: fresh references check across `src`, `tests`, `supabase`, config, CI, package scripts, and route conventions.
- No blind `supabase db push`. DB changes require targeted migration or targeted prod-safe data update with before/after proof.
- No secrets in commits/reports/log excerpts.
- No automation attribution in commits.
- Use small risk-ordered commits. One category per commit where practical.
- If a batch fails gates, revert that batch only, write BLOCKED note in `.refactor/REPORT.md`, and continue to the next safe batch. Do not abandon the whole mission.
- If local root contains unrelated dirty files, classify them first; preserve intentional docs, remove truly obsolete debris, and do not mix unrelated product changes without evidence.
- If product decisions are missing, act as PM: choose the safest MVP behavior-preserving option, note assumption, continue.

## Verification gates
Baseline from `.refactor/BASELINE.md`:
- typecheck green
- lint/pre-commit-equivalent green, respecting the known pre-existing `lint-gid-literal` caveat
- `bun run test:run` should remain at/near 1082 passing unless tests are intentionally deleted with dead code; document new count and reason
- `bun run build` green

Run after each batch or logical sub-batch:
- fresh reference checks for every deletion
- `bun run typecheck`
- `bun run lint` or pre-commit-equivalent set from baseline when `bun run check` includes known quarantined lint-gid issue
- targeted tests for touched areas
- full `bun run test:run` at milestones
- `bun run build` before final commit/report

Final verification:
- `git status --short`
- `git log --oneline -10`
- final diff summary / LOC removed
- final gates with command output summaries
- if live DB/deploy touched: live proof and rollback notes

## Required deliverables
- Multiple clean commits on `refactor/deslop-20260707`.
- `.refactor/REPORT.md` with:
  - executive summary
  - commits and changed/deleted files
  - LOC/dependency/env cleanup numbers
  - DB actions, if any, with sanitized before/after and rollback
  - each batch: done / partial / blocked, with why
  - every deferred item with reason
  - final gate results
  - known caveats
  - short sanitized Russian owner update (3–7 word ✅ bullets)
- Branch pushed to origin when final gates pass.
- If normal project process requires PR, open/update PR and include the report summary.
- If deploying is appropriate after merge, update VPS and verify service/Caddy/public HTTP. If merge/deploy cannot be completed due to external auth/CI blocker, document exact blocker and next action.

## Done condition
Do not stop until either:
- the refactor plan has been executed as far as safely possible, final gates are run, `.refactor/REPORT.md` exists, commits exist, branch is pushed, and any DB/deploy work is verified; or
- a concrete external blocker is proven with exact next action and all safe work before it is committed/reported.
