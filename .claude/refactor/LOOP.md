# Provodnik Refactor Loop — self-evolving cursor dispatch

This is the operating protocol for the `/loop` that walks `tasks.json` and fixes the audit findings
via the sanctioned Cursor SDK. The **mechanics** live in `run.mjs`; the **intelligence**
(prompt authoring + self-evolution on failure) is the Claude orchestrator's job each iteration.

## Invariants (hard rules)
- **No push to `origin/main`.** That is the Vercel prod branch. Verified work accumulates on
  `refactor/full-2026-06`. The final push is a separate, user-approved step (task `7.4`).
- **Cursor dispatch ONLY via** `/Users/idev/quantumbek/tools/dispatch-cursor.mjs` (ADR-010).
- **No `git`/`bun` inside cursor prompts** (ADR-025) — the wrapper's appended contract handles the
  agent-side `bun run check`; the orchestrator owns integration git + final verify.
- **3-strike stop.** After `max_attempts` (3) failed dispatches on one task → mark `blocked`, SOS, move on.
- **Money via `src/data/money.ts`** (AP-012), **client/server import boundary** (AP-014),
  **PII masking** (PII-012), **TZ-pinned dates** (AP-010) — inline the relevant HOT entry in any prompt
  that touches those areas.

## One iteration (what the orchestrator does each /loop tick)
1. `node run.mjs next` → get the next runnable task (deps integrated, attempts < 3).
   - If `{done:true}` and no `failed`/`passed` remain → loop is complete; stop.
   - If executor is `orchestrator` → do it directly (git mv/rm, dep edits, docs) on the integration
     branch, run its `verify`, then `node run.mjs set <id> integrated`. No cursor.
   - If executor is `mixed` → do the git moves/renames directly first, then dispatch cursor for the
     import-path edits (treat as a `cursor` task for the edit portion).
2. **Author the prompt** `out/<id>.md` from `SKELETON` + the task's scope/done + real source excerpts
   (read the in-scope files, paste first ~100 lines each) + the relevant HOT landmine(s) verbatim.
   Keep ≤ ~6k tokens, ≤ 5 files. Do NOT include git/bun instructions.
3. `node run.mjs dispatch <id>` → wrapper creates worktree, runs cursor w/ context7, runs gates,
   commits to `agent/<slug>`. Exit 0 = gates passed; exit 3 = gates failed (worktree left).
4. **On exit 0:** `node run.mjs integrate <id>` → merge `agent/<slug>` into the integration branch,
   run the task's `verify` there. Green → `integrated`. Conflict/verify-fail → back to `failed`.
5. **On exit 3 (self-evolve):** read `runs/<id>-aN-*.json` `gates`. Rewrite `out/<id>.md` to fix the
   exact failure, then `dispatch` again. Evolution rules:
   - `context7-used` failed → add an explicit, louder context7 trigger naming the lib+symbol and a
     line "paste the version + signature you used".
   - `scope-guard` failed → the agent touched a file outside scope; either add that file to the task
     `scope` (if legitimately needed) or sharpen the prompt to forbid touching it; re-list SCOPE.
   - `hygiene` failed → the agent introduced `console.log`/`TODO`/`: any`/admin-client-outside-lib;
     name the offending line and forbid it; point to `logError` (task 3.3) instead of console.
   - `non-empty` failed → the agent refused/no-op'd; sharpen the task statement, add the failing-test
     first (TDD RED) so there is something concrete to make pass.
   - `spec-diff` failed → restate the acceptance criteria at the top of the prompt verbatim.
6. `node run.mjs report` (run.mjs does this automatically on set/dispatch/integrate) and update
   the human report `docs/audits/2026-06-11-full-audit.md` "status" column as tasks integrate.
7. `ScheduleWakeup` for the next tick (dispatch is minutes; poll the background dispatch, then continue).

## Pacing
Each cursor dispatch with a worktree + Supabase stack takes several minutes. Run `dispatch` in the
background, `ScheduleWakeup` ~270s to stay in cache while it runs, then read the run record and either
`integrate` or self-evolve. Idle ticks (waiting on nothing) → 1200s+.

## Resume
State is fully in `tasks.json` (status/attempts/last_failure) + `runs/`. Any fresh session resumes by
running `node run.mjs next` and continuing the iteration above. `INTEGRATED.log` is the append-only ledger.
