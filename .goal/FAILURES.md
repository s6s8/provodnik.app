# FAILURES — dead approaches, signatures, prevention rules

(empty at start; append signature + prevention rule on each failure)

## F-01 — `git add -A` while background agents are writing
**Signature**: committed T-08/T-09 with `git add -A` while two subagents (T-10, T-11) were mid-edit in the same worktree. Their files were swept into a commit whose message never mentions them; the next `git commit` then reported "nothing to commit, working tree clean".
**Root cause**: `-A` stages the whole worktree, which is shared with concurrently-running agents. Green gates hid it — the commit was correct code, just dishonest scope.
**Repair**: `git reset --soft HEAD~1` + `git reset`, then re-staged by explicit path into two accurate commits (ee1a407f T-08/09, da14a317 T-10/11). Nothing lost, branch never pushed.
**Prevention rule (now in PLAYBOOK)**: while any background agent is running, NEVER `git add -A`/`git add .` — stage by explicit path, and check `git status --short` for files you did not touch before committing.
