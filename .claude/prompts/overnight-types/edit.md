# TYPE: EDIT

You are executing one EDIT row. The row's title and verify clause name a
small, mechanical edit to one or more files in this repo. EDITs do not
require cursor-agent — you apply the change directly.

## Recipe

1. Re-read your row's `title`, `file/scope hint`, and `verify:` clause.
2. Open every named file. Read enough context (~50 lines around the
   target) to understand the change.
3. Apply the change exactly as the row describes. If the row references
   the parent plan section (`per plan §PF-1 Step 2`), open the plan at
   `docs/superpowers/plans/2026-05-02-provodnik-launch-readiness-implementation.md`
   and read the named step verbatim.
4. Run the verify command(s) from the row. They must pass.
5. Stage the modified files: `git -C provodnik.app add <files>` (or
   `git add <files>` if the file is outside `provodnik.app/`).
   Stage by exact name; never `git add .` or `git add -A`.
6. Commit with the message format the row specifies (or, if the row
   doesn't specify, use Conventional Commits — `fix(scope): one-line`).
7. Push to origin/main: `git push origin main`.
8. Read git log: `git -C provodnik.app log -1 --format=%H`.
9. Update the ledger row to `[x]` with `commit:` = the SHA, `evidence:` =
   the verify command output (one line), `status-note:` = `DONE @ <UTC>`.
10. Exit 0.

## Verify clause execution

Verify clauses are written as one of:
- `cd provodnik.app && bun run typecheck` — exit 0
- `bun run test:run -- <name>` — 0 failures
- `grep -c "<pattern>" <file>` — returns specified count
- A natural-language assertion ("the wizard renders 8 chips")

For commands: run them. They must succeed.
For natural-language assertions: run a derived command that proves the
assertion (`grep -c "id:" provodnik.app/src/data/interests.ts` for the
wizard chip count). If you cannot derive a command, fall through to the
self-healing ladder.

## Self-healing ladder

If step 3 (apply change) is ambiguous because the file content has drifted
from what the row describes:
- Read the parent plan section in full.
- Read up to 100 lines around the target file's apparent intent area.
- Apply the smallest change that satisfies the verify clause.
- If still ambiguous → mark `[!]` with status-note
  "ambiguous-edit: <which file>, <which line>, <what's unclear>".

If step 4 (verify) fails:
- Read the failure output. Identify the gap.
- If the gap is a missed file or pattern, fix and retry verify.
- If the gap is a deeper issue (typecheck cascade across unrelated files),
  rollback your changes (`git checkout -- <files>`) and mark `[!]` with
  status-note "verify-cascade: <error summary>".

If step 6 (commit) fails because of pre-commit hook:
- Read hook output. Address each error.
- Re-stage, re-commit (a NEW commit, never `--amend` past the first attempt).
- Repeat up to 3 times. If still failing → mark `[!]` with hook output.

If step 7 (push) fails:
- `git fetch origin` and check whether main has advanced.
- If yes: `git pull --rebase origin main`, resolve any non-conflicting
  rebase, push again. If conflicts arise: do NOT auto-resolve. Mark `[!]`.
- If push is rejected for other reasons: mark `[!]` with full error.

## Ledger update — exact format

Replace the row block. Keep all other ledger content untouched.

Before:
- [ ] **T###** [PRE] [EDIT] <title> — <hint> — verify: <how>
  commit: <pending>
  evidence: —
  depends-on: none
  status-note:

After (success):
- [x] **T###** [PRE] [EDIT] <title> — <hint> — verify: <how>
  commit: <SHA>
  evidence: <one-line proof, e.g. "bun run typecheck → 0 errors">
  depends-on: none
  status-note: DONE @ <UTC ISO>

After (self-block):
- [!] **T###** [PRE] [EDIT] <title> — <hint> — verify: <how>
  commit: <pending>
  evidence: —
  depends-on: none
  status-note: BLOCKED @ <UTC ISO> — <reason>
