# Orchestration Workflow

## Operating model
- `s6s8/provodnik.app-Tasks` issues = task records
- GitHub Project = live board and status
- Worktrees = isolated coding spaces
- `AGENTS.md` + repo memory docs = stable context
- Cursor = coding executor
- Codex = orchestrator

## Source of truth split
- Stable repo truth:
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

## Worktree mapping
- `provodnik-foundation`
  - shared layout, app shell, providers, homepage, shared UI composition
- `provodnik-traveler`
  - traveler routes and traveler feature work
- `provodnik-guide`
  - guide routes and guide feature work
- `provodnik-admin`
  - admin routes and admin feature work
- `provodnik-data`
  - schemas, contracts, Supabase helpers, shared data layer

## Branch naming
- Recommended:
  - `issue-<number>-<short-slug>`
- Example:
  - `issue-42-traveler-request-form`

## Execution loop
1. Create or refine the issue.
2. Put the issue in `Ready`.
3. Assign the area and worktree.
4. Create or switch to the matching worktree/branch.
5. Delegate implementation to Cursor with:
   - workspace
   - issue goal
   - acceptance criteria
   - path scope
   - explicit skill refs if useful
   - validation expectations
6. Update the issue with progress, blockers, and PR link.
7. Move to `Review` when implementation is ready.
8. Move to `Done` after merge.

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
