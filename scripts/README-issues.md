# Issues and worktrees

`IMPLEMENTATION.md` is the planning source of truth.

Use issues and this scripts folder to execute that plan, not to create a separate competing roadmap.

## Pull issues from GitHub

From the **app repo root**:

```powershell
./scripts/pull_issues.ps1
```

This:

- Runs `gh issue list --repo s6s8/provodnik.app-Tasks --state open --limit 50`
- Writes `scripts/open-issues.json` (number, title, state, url, phase, branch, worktree)
- Regenerates the tables in `scripts/open-issues.md`

Requires: [GitHub CLI](https://cli.github.com/) (`gh`) authenticated with access to `s6s8/provodnik.app-Tasks`.

---

## Update issues (GitHub)

### Close an issue (e.g. when done)

```bash
gh issue close <number> --repo s6s8/provodnik.app-Tasks
```

With a comment (e.g. “Done in PR #…”):

```bash
gh issue close <number> --repo s6s8/provodnik.app-Tasks --comment "Done in PR #42."
```

### Add a comment

```bash
gh issue comment <number> --repo s6s8/provodnik.app-Tasks --body "Implementation in branch impl/issue-7-request-detail."
```

### Add a label

```bash
gh issue edit <number> --repo s6s8/provodnik.app-Tasks --add-label "in-progress"
```

### Move on GitHub Project board

Use the GitHub Projects UI, or [gh project item commands](https://cli.github.com/manual/gh_project) if your project is linked.

---

## Full agent TODO and worktrees

- **Full checklist and order:** `scripts/AGENT_TODO.md`
- **Worktree paths and branch list:** `scripts/open-issues.md` (after running `pull_issues.ps1`)

## Parallel worktree workflow

1. **Pull issues** (optional): `./scripts/pull_issues.ps1`
2. **Open one Cursor window per worktree** (see table in `open-issues.md`).
3. **In each worktree:** the branch is already set (e.g. `impl/issue-3-dark-public-shell`). Implement, then `bun run lint` and `bun run typecheck`.
4. **Commit and push** from that worktree; open PR from that branch to `main`.
5. **After merge:** close the issue (with PR link). In that worktree, `git checkout main` and `git pull`, then switch to the next branch for that worktree (e.g. `git checkout impl/issue-4-shared-components`).
6. **Update local list:** run `./scripts/pull_issues.ps1` again so closed issues drop out of `open-issues.json`.
