---
name: codex-result
description: Run automatically after every codex exec — verify build, check commits, update PLAN.md and handoff.md, report to user
---

# Codex Result Handler

Invoked automatically after every `codex exec` via the CODEX_DONE PostToolUse hook.
Do not skip any step. Do not ask the user to do these steps.

## Step 1 — Check what Codex committed

```bash
git -C D:/dev/projects/provodnik/provodnik.app log --oneline -5
```

Look for commits with `Co-Authored-By: Claude` or that match the task description.
If no new commit → Codex did not commit. Note this — report to user at the end.

## Step 2 — Check for BLOCKED status

```bash
ls D:/dev/projects/provodnik/provodnik.app/.sdd/ 2>/dev/null
```

If a `.sdd/<change-name>/verify.md` exists, read it.
If it contains `BLOCKED` → extract the specific blocker and report to user immediately. Stop the skill here.

## Step 3 — Verify build

```bash
cd D:/dev/projects/provodnik/provodnik.app && bun run build 2>&1 | tail -20
```

Then:
```bash
bun run typecheck 2>&1 | tail -10
```

If either fails → report errors to user. Do not update PLAN.md. Stop here.

## Step 4 — CSS audit (quick scan of changed files)

Run against the files Codex modified (visible in git diff):
```bash
git -C D:/dev/projects/provodnik/provodnik.app diff HEAD~1 --name-only
```

For each `.tsx` or `.css` file in the diff, check:
- [ ] No `style={{}}` added for layout (padding, margin, position, z-index)
- [ ] No hardcoded hex values outside `:root` in globals.css
- [ ] No new `<style>` blocks in components

If any violation found → note it in the report but do not revert.

## Step 5 — Update PLAN.md

Read `D:\dev\projects\provodnik\PLAN.md`.
Find the task that matches what Codex just implemented.
Change its `[ ]` to `[x]` and add the commit hash inline:

```
- [x] 1.1 Task name — `abc1234`
```

## Step 6 — Update handoff.md

Read `D:\dev\projects\codex-ops\state\handoffs\provodnik\handoff.md`.
Add an entry under **Changed Recently**:

```
- [DATE] <task name> — <commit hash> — build ✓ / typecheck ✓
```

Update **Active Focus** to the next unchecked PLAN.md item.

## Step 7 — Report to user

Output a short summary:
```
Done: <task name>
Commit: <hash>
Build: ✓ / ✗
Typecheck: ✓ / ✗
CSS audit: clean / <issue if any>
Next: <next unchecked PLAN.md item>
```

If Codex did not commit → report: "Codex made changes but did not commit. Run /finish-task to commit manually."
