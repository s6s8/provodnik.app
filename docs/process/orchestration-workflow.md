# Orchestration Workflow

## Operating model
- `IMPLEMENTATION.md` = planning source of truth
- `design/IMPLEMENTATION-GUIDE.md` + `design/STAKEHOLDER-FEEDBACK.md` + `design/LAYOUT.md` = active design constraints that must be reflected in planning and issue wording
- `s6s8/provodnik.app-Tasks` issues = task records
- GitHub Project = live board and status
- Worktrees = isolated coding spaces
- `AGENTS.md` + repo memory docs = stable context
- Cursor = coding executor
- Codex = orchestrator
- Paperclip = execution control plane

## Source of truth split
- Stable repo truth:
  - `IMPLEMENTATION.md`
  - `AGENTS.md`
  - `PROVODNIK-REPO-MEMORY.md`
  - `docs/architecture/module-map.md`
  - `.cursor/rules/*.mdc`
  - `.github/instructions/*.instructions.md`
  - `docs/adr/*`
- Live execution state:
  - `s6s8/provodnik.app-Tasks` issues
  - GitHub Project
  - Pull requests

## Planning rule
- `IMPLEMENTATION.md` is the only planning source of truth.
- Issues, project items, and local helper files must mirror its phases, route map, and acceptance direction.
- If an issue list or roadmap conflicts with `IMPLEMENTATION.md`, update the helper doc or issue wording instead of inventing a second plan.
- If the design docs introduce sharper requirements than the current issue wording, update `IMPLEMENTATION.md` and the affected issues before delegating coding work.

## Paperclip role model

- `CEO`
  - approves the active delivery program
  - approves hiring and escalation paths
- `Provodnik Tracker`
  - normalizes GitHub issues
  - updates GitHub status and comments
  - assigns execution-ready work to the `CTO`
- `CTO`
  - owns technical sequencing and lane assignment
  - manages dependency order and integration readiness
  - updates durable workflow and architecture docs
- Cursor executors
  - implement scoped issues in assigned worktrees
- Codex review lanes
  - verify, integrate, and reconcile tracker or doc drift

## Issue model
- One issue = one concrete task or bug.
- Each issue must include:
  - goal
  - scope
  - out of scope
  - acceptance criteria
  - area
  - worktree
  - expected paths
  - blockers or dependencies

## Project model
- Active project:
  - `Provodnik`
  - `https://github.com/users/s6s8/projects/1`
- Built-in field:
  - `Status`: `Todo`, `In Progress`, `Done`
- Custom workflow field:
  - `Workflow`: `Backlog`, `Ready`, `In Progress`, `Blocked`, `Review`, `Done`
- Active extra fields:
  - `Priority`
  - `Area`
  - `Worktree`
  - `Branch`
- Built-in fields already cover:
  - `Assignees`
  - `Labels`
  - `Linked pull requests`
  - `Milestone`
  - `Repository`

## Worktree mapping (parallel implementation)

Implementation worktrees and branches live under `D:\dev\projects\provodnik\worktrees\`:

| Worktree | Path | Issues (branch per issue) |
|----------|------|---------------------------|
| **provodnik-data** | `worktrees/provodnik-data` | #2 `impl/issue-2-arch` |
| **impl-foundation** | `worktrees/impl-foundation` | #3–#12, #17 (`impl/issue-N-...`) |
| **impl-traveler** | `worktrees/impl-traveler` | #13, #14 |
| **impl-guide** | `worktrees/impl-guide` | #15, #16 |
| **impl-admin** | `worktrees/impl-admin` | #18 |

- **Pull issues:** run `./scripts/pull_issues.ps1` from app repo root (updates `scripts/open-issues.json` and `scripts/open-issues.md`).
- **Full agent TODO:** `scripts/AGENT_TODO.md` (checklist, phase order, quick commands).
- **Update/close issues:** `scripts/README-issues.md` (gh issue close, comment, labels).
- **One Cursor window per worktree** = work on multiple issues in parallel; switch branch in that worktree for the next issue in sequence.

## Branch naming
- Active convention:
  - `impl/issue-<number>-<short-slug>`
- Example:
  - `impl/issue-13-traveler-dashboard`

## Execution loop
1. Create or refine the issue.
2. Put the issue in `Ready`.
3. Assign the area and worktree.
4. Tracker creates or updates the matching Paperclip issue and assigns it to the `CTO`.
5. `CTO` creates or switches to the matching worktree/branch.
6. Delegate implementation to Cursor with:
   - workspace
   - issue goal
   - acceptance criteria
   - path scope
   - explicit skill refs if useful
   - validation expectations
7. Update the GitHub issue with progress, blockers, checks, and PR link.
8. Append a concise implementation note to `D:\dev\projects\codex-ops\projects\provodnik\dev-notes.md`.
9. Mirror the same note into Slack when Slack auth is available.
10. Move to `Review` when implementation is ready.
11. Move to `Done` after merge.

## Validation rule
- Fast branch validation in worktrees:
  - `bun run lint`
  - `bun run typecheck`
- Final route/framework validation:
  - run `bun run build` on `main` after the worktree change is merged or cherry-picked
- Reason:
  - the local worktree setup reuses the main install for speed, and Next/Turbopack rejects out-of-root linked `node_modules` during `build`

## Labels
- Area:
  - `area:foundation`
  - `area:traveler`
  - `area:guide`
  - `area:admin`
  - `area:data`
- Type:
  - `type:feature`
  - `type:bug`
  - `type:refactor`
  - `type:docs`
  - `type:chore`

## Cursor delegation format
```text
Workspace: D:\dev\projects\provodnik\worktrees\provodnik-traveler
Issue: s6s8/provodnik.app-Tasks#42
Task: Implement traveler request form.
Use: /frontend-agent /react-best-practices
Rules: follow AGENTS.md and .cursor/rules; use --model auto; do not touch unrelated files.
Validate: bun run lint, bun run typecheck
Return: changed files, checks run, remaining risks.
```

## Remote GitHub setup
- Remote setup completed on GitHub:
  - labels for `area:*` and `type:*`
  - project `Provodnik`
  - code repository `s6s8/provodnik.app`
  - task repository `s6s8/provodnik.app-Tasks`
  - custom fields `Workflow`, `Area`, `Worktree`, `Priority`, `Branch`
- Next optional improvements:
  - create saved views on GitHub
  - add project automation
  - create the first issues from the repo templates
