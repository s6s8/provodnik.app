# TYPE: PARALLEL CLUSTER (multiple DISPATCH rows in one Opus invocation)

You are executing N DISPATCH rows IN PARALLEL. The supervisor pre-claimed
all N rows; your job is to spawn N native Agent subagents in ONE batched
message, each owning one worktree + one cursor-dispatch invocation, then
reconcile all N rows after all Agents report.

The cluster is one of:
- {T011, T012, T013, T014} — Phase 2 four parallel polish dispatches
- {T017, T018} — Phase 3 cabinet editor + inbox sort

## Recipe

1. Read each row's full body. Extract: branch, worktree path, prompt-file
   path, files in scope, verify clause.
2. For each row, compose its cursor-agent prompt the same way the
   single-row DISPATCH template does (read parent plan, pull existing
   brief at `_archive/bek-frozen-2026-05-08/prompts/out/<task>.md`, fill skeleton, save to
   `_archive/bek-frozen-2026-05-08/prompts/out/<task>-overnight-iter<N>.md`).
3. Create all N worktrees (sequentially — git worktree creation must be
   serial):
   ```
   git worktree add D:/dev2/worktrees/<name1> -b <branch1>
   git worktree add D:/dev2/worktrees/<name2> -b <branch2>
   ...
   ```
4. Spawn N native Agent subagents in ONE batched message via the Agent
   tool, with `run_in_background: true`. Each Agent's brief:
   ```
   You are dispatching cursor-agent for one task in a parallel cluster.

   Worktree:    <absolute path>
   Branch:      <branch>
   Prompt file: <absolute path>

   Run via Bash:
     node D:/dev2/projects/provodnik/.claude/logs/cursor-dispatch.mjs \
       <prompt-file> \
       --workspace "<worktree>\\provodnik.app" \
       --timeout 900

   Tail via Monitor. Report DONE only when wrapper exits 0 AND the [result]
   event shows success. Before reporting DONE, run inside the worktree:
     git -C <worktree> log main..HEAD --oneline
   Must show ≥1 commit. If 0, report ZERO_COMMIT — orchestrator handles.
   ```
5. Wait for all N Agents to complete (they run in background; you'll be
   notified).
6. For each Agent that returned DONE: run the same verification ladder as
   `dispatch.md` step 10–17 (commit existence, scope check, quality gates,
   HOT.md grep, browser audit, merge).
7. For each Agent that returned ZERO_COMMIT: apply the cluster row's edits
   directly per ERR-049, then run verification.
8. Merge each branch to main FF-only, sequentially (concurrent merges
   would race on origin/main).
9. Post-deploy check: latest Vercel deploy READY, no new Sentry.
10. Cleanup all worktrees + branches.
11. Update ALL N ledger rows in ONE atomic Write call to `[x]`.
12. Exit 0.

## Partial-success handling

If some Agents returned DONE and merged, but one or more failed:
- Mark the merged ones `[x]` (their commits already landed).
- Mark the failed ones still `[~]` (do not flip back to `[ ]` — the
  supervisor will see this and revert to `[ ]` itself).
- Exit 0 with a stdout line: `partial-cluster T### x of N done; T### still [~]`.
- The supervisor will retry the failed rows as SOLO rows (no longer
  treats them as a cluster).

## Self-healing

Agent never reports back (timeout, crash):
- After 1800 s wall clock from spawn, mark that row's status as
  unfinished. Proceed with the rest.

Two Agents both try to merge to main and one's FF fails:
- That's expected (they raced). Rebase the loser onto main, push, retry
  merge for the loser. Sequential merge inside reconciliation handles
  this naturally.

## Ledger update

Same shape as DISPATCH but writes N rows in one atomic Write call.
