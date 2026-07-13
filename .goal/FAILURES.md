# FAILURES — dead approaches, signatures, prevention rules

(empty at start; append signature + prevention rule on each failure)

## F-01 — `git add -A` while background agents are writing
**Signature**: committed T-08/T-09 with `git add -A` while two subagents (T-10, T-11) were mid-edit in the same worktree. Their files were swept into a commit whose message never mentions them; the next `git commit` then reported "nothing to commit, working tree clean".
**Root cause**: `-A` stages the whole worktree, which is shared with concurrently-running agents. Green gates hid it — the commit was correct code, just dishonest scope.
**Repair**: `git reset --soft HEAD~1` + `git reset`, then re-staged by explicit path into two accurate commits (ee1a407f T-08/09, da14a317 T-10/11). Nothing lost, branch never pushed.
**Prevention rule (now in PLAYBOOK)**: while any background agent is running, NEVER `git add -A`/`git add .` — stage by explicit path, and check `git status --short` for files you did not touch before committing.

## F-02 — copy change smuggled into a structural task
**Signature**: T-24 (admin shell structure) also changed "администраторам Provodnik" → «Проводника». `admin/layout.test.tsx` pins that string, so the commit's own test gate failed: `Unable to find an element with the text: /администраторам Provodnik/`.
**Root cause**: opportunistic drift — that rename is T-39's (copy/vocabulary sweep), not T-24's. A task that touches two concerns fails one of them.
**Repair**: reverted the copy line inside T-24; the rename + its test update happen in T-39, where the whole `Provodnik`→«Проводник» gate lives.
**Prevention rule**: when a file tempts you with an out-of-scope fix, leave it for the task that owns it. One concern per commit — the test suite is what enforces it.

## F-03 — a hook-blocked commit leaves the index staged
**Signature**: `git commit` was rejected by the pre-commit hook (a concurrent agent's file was mid-edit). The files stayed STAGED. The next task's `git add` + `git commit` therefore swept those already-staged files into it: commit 4673803e carried T-24 + T-17 + T-21 under a T-24-only message.
**Root cause**: a failed commit does not clear the index. `git add <paths>` ADDS to whatever is already staged — it does not define the commit's contents.
**Repair**: `git reset --soft` to the last honest commit, `git reset` to clear the index, then re-committed as four atomic commits (a447e16b T-24, 77296eea T-17, 71ea12e0 T-21, 20389b3a T-19). Nothing lost; branch never pushed.
**Prevention rule (now in PLAYBOOK)**: ALWAYS `git reset` (unstage everything) immediately before `git add <paths>` for a task. Never assume a clean index — verify with `git diff --cached --name-only` that the staged set equals the task's file list before committing.

## F-04 — subagent died to an API connection error (T-31, first attempt)
**Signature**: `Agent terminated early due to an API error: Connection closed mid-response` — the agent had produced no edits (its only output was "I'll start by reading the four target files").
**Classification**: INFRASTRUCTURE, not strategy. The contract bans retrying a recorded failure *signature* (a dead approach); a transport-level drop with zero work done is not one.
**Action**: relaunched T-31 verbatim. Tree was untouched, so no cleanup was needed.
**Prevention rule**: before relaunching a dead agent, confirm with `git status` that it left no half-written files; if it did, revert those paths first so the retry starts from a clean checkpoint.
