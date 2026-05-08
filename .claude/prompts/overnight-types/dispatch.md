# TYPE: DISPATCH

You are executing one DISPATCH row — a non-trivial code change that goes
through cursor-agent (the blind junior coder) via `cursor-dispatch.mjs`.

This is the highest-judgment row type. You compose a fresh, self-contained
prompt for cursor-agent from `_archive/bek-frozen-2026-05-08/prompts/skeleton.md` (the orchestrator
composes by hand — no builder script). You dispatch. You verify. You
merge.

## Recipe

1. Read your row's `title`, `file/scope hint`, branch name, and `verify:`
   clause.
2. Read the parent plan section in full (the row points at it).
3. Read the existing brief at `_archive/bek-frozen-2026-05-08/prompts/out/<task>.md` if one exists
   (the row will reference it). Otherwise compose from skeleton.
4. Read every file in scope to understand what cursor-agent will edit.
   Capture exact patterns it must follow (existing component shapes, types,
   import paths, naming conventions).
5. Look up relevant SOT IDs from `_archive/bek-frozen-2026-05-08/sot/INDEX.md`. Pull HOT.md entries
   verbatim into the KNOWLEDGE section.
6. Compose the final prompt at `_archive/bek-frozen-2026-05-08/prompts/out/<task>-overnight-iter<N>.md`
   (use iteration suffix so multiple retries don't overwrite each other).
   The prompt MUST be self-contained — cursor-agent has zero MCP, zero
   memory, zero discovery. Inline every file path, every code excerpt,
   every API signature.
7. Token budget check: if your composed prompt exceeds 8000 tokens, split
   into smaller scope. (Approximate: 1 token ≈ 4 chars; 8000 tokens ≈ 32 KB.)
8. Create the worktree (the row names the path):
   ```
   git worktree add D:/dev2/worktrees/<name> -b <branch>
   ```
   If the worktree path already exists from a prior failed iteration:
   `git worktree remove --force D:/dev2/worktrees/<name>`, then create.
9. Dispatch via the wrapper. Use the Bash tool (PowerShell-compatible
   command):
   ```
   node D:/dev2/projects/provodnik/.claude/logs/cursor-dispatch.mjs \
     D:/dev2/projects/provodnik/_archive/bek-frozen-2026-05-08/prompts/out/<task>-overnight-iter<N>.md \
     --workspace "D:\\dev2\\worktrees\\<name>\\provodnik.app" \
     --timeout 900
   ```
   The wrapper streams `[init] → [tool_call] → [assistant] → [result]`
   events. Wait for it to exit. Read the dispatch log at
   `_archive/bek-frozen-2026-05-08/logs/cursor-dispatch-*.log` (latest).
10. Verify cursor-agent committed:
    ```
    git -C D:/dev2/worktrees/<name> log main..HEAD --oneline
    ```
    Must show ≥1 commit. If 0 → ZERO_COMMIT path (see self-healing).
11. Verify scope:
    ```
    git -C D:/dev2/worktrees/<name> diff main..HEAD --name-only
    ```
    Every file must appear in your prompt's SCOPE list. Out-of-scope =
    scope creep (see self-healing).
12. Verify quality gates IN THE WORKTREE:
    - `cd D:/dev2/worktrees/<name>/provodnik.app && bun run typecheck`
    - `cd D:/dev2/worktrees/<name>/provodnik.app && bun run lint -- <scoped-files>`
    - `cd D:/dev2/worktrees/<name>/provodnik.app && bun run test:run` if
       tests touched
    All must pass.
13. HOT.md grep on the diff:
    ```
    git -C D:/dev2/worktrees/<name> diff main..HEAD | grep -E "todayLocalISODate|\\* 100|\\/ 100|signUp\\(|signOut\\(\\)"
    ```
    Must return 0 hits (those are landmines from HOT.md).
14. Browser audit if the row's `verify:` clause names a route. Use
    chrome-devtools-mcp:
    - `new_page` → preview Vercel URL for the branch (or production URL if
       not yet merged) → `resize_page` to 1280×800 then 375×667.
    - `take_snapshot`, `take_screenshot`, `list_console_messages`.
    - Confirm every observable claim in the verify clause.
    - If preview deploy hasn't built yet, wait up to 5 minutes
       (poll `mcp__plugin_vercel-plugin_vercel__list_deployments`).
15. Merge to main, fast-forward only:
    ```
    git checkout main
    git -C provodnik.app merge --ff-only <branch>
    git -C provodnik.app push origin main
    ```
    If FF-only fails (main has advanced): `git fetch origin`, then
    `git rebase origin/main` IN THE WORKTREE, push, retry merge. Never
    force.
16. Post-deploy check (Vercel build + Sentry):
    - `mcp__plugin_vercel-plugin_vercel__list_deployments` → latest must
       become `READY` (poll up to 10 minutes).
    - Sentry: any new issue since `kickoffSha`? Use Sentry API.
17. Cleanup:
    ```
    git worktree remove D:/dev2/worktrees/<name>
    git branch -d <branch>
    ```
18. Update ledger row `[x]` with `commit:` = `git log -1 --format=%H` on
    main, `evidence:` = "preview verified at <url> + Vercel READY", exit 0.

## Self-healing — DISPATCH-specific ladders

ZERO_COMMIT (cursor-agent claimed DONE but didn't commit):
- Read the dispatch log to see if cursor-agent edited the main workspace
  by mistake (ERR-054). If so:
  `git -C provodnik.app status --short` — if expected diff is there, copy
  files into the worktree, commit there, then `git checkout -- <files>`
  in main to clean up.
- Otherwise, apply the edits directly per ERR-049 (read your prompt's
  TASK section, do the edits yourself in the worktree, commit, proceed).
- NEVER re-dispatch on ZERO_COMMIT.

Scope creep (out-of-scope file modified):
- `git -C <worktree> reset --hard main` (this is destructive but bounded
  to the worktree, not main, and the kickoffSha is unaffected — allowed).
- Re-compose prompt with TIGHTER SCOPE block: list ONLY the in-scope
  files; add a "DO NOT EDIT" list naming the file(s) the agent strayed to.
- Re-dispatch. Counts toward retry budget.

Typecheck / lint / test failure in worktree:
- Diagnose. If small (a missing import, a type cast), fix inline in the
  worktree, commit fix, proceed.
- If structural (missed a refactor in another file), apply the fix
  directly. Commit. Proceed. (You are no longer dispatching to cursor-
  agent for the fix; you do it.)

Browser audit reveals visual regression:
- Apply the smallest possible fix in the worktree, commit, proceed.
- If the regression is in a file outside SCOPE → revert the entire branch
  (`git reset --hard main` in worktree), re-dispatch with broader SCOPE.

Vercel build ERROR after push:
- Read build logs via Vercel MCP. Diagnose. Fix inline on main, commit,
  push. Repeat up to 2 attempts.
- If 2 attempts unclear → `git revert <sha> && push`, mark row `[!]` with
  full Vercel build log summary.

New Sentry issue:
- Read issue + stack trace. Fix inline on main, commit, push. Repeat up
  to 2 attempts.
- Same fallback as Vercel: revert + `[!]`.

Same row retry ≥ 5 (escalation already to Opus): you have full vision
context. Critique the row's verify clause:
- Is it impossible because the file shape changed since plan was written?
  Adapt the recipe (don't change the verify clause unless retry ≥ 10).
- Is it impossible because the dependency it assumes (a column, a route)
  doesn't exist? Walk dependency graph backwards — was a prior row
  supposed to create it but actually didn't?

Same row retry ≥ 10: scope-critique mode. You may rewrite the row's
`verify:` clause IF AND ONLY IF the rewrite advances both Биржа and
Готовые туры and is grounded in the vision. Document the rewrite in
`status-note: SCOPE-REWRITE @ <UTC> — <old verify> → <new verify> · why:
<reason>`. Then proceed with the new verify clause.

## Ledger update — exact format

Same shape as EDIT, with TYPE = DISPATCH and evidence including preview
URL + Vercel build status.
