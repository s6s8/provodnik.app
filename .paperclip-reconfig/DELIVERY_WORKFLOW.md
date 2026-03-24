# Provodnik Delivery Workflow

This file defines the end-to-end operating loop between `Provodnik Tracker`, `CTO`, the specialist lanes, and final integration.

## Repositories

- Code repo: `/mnt/rhhd/projects/provodnik.app`
- Task source: `s6s8/provodnik.app-Tasks`
- GitHub Project: `Provodnik`

## Documentation Ownership

- `CTO` owns stable technical documentation and durable workflow docs.
- `Provodnik Tracker` owns live execution documentation and status updates.

### Stable technical documentation

Examples:

- `AGENTS_TEAM.md`
- `DELIVERY_WORKFLOW.md`
- engineering runbooks
- durable workflow and integration docs

### Live execution documentation and status

Examples:

- GitHub issue comments
- project field updates
- Paperclip task comments
- execution closeout notes

## Worktrees

- Foundation: `/mnt/rhhd/projects/worktrees/provodnik-foundation`
- Traveler: `/mnt/rhhd/projects/worktrees/provodnik-traveler`
- Guide: `/mnt/rhhd/projects/worktrees/provodnik-guide`
- Admin: `/mnt/rhhd/projects/worktrees/provodnik-admin`
- Data: `/mnt/rhhd/projects/worktrees/provodnik-data`

## Tracker Workflow

1. Pull open issues from `s6s8/provodnik.app-Tasks`.
2. Read issue body, labels, and comments.
3. Normalize the issue so it includes:
   - goal
   - scope
   - out of scope
   - acceptance criteria
   - area
   - worktree
   - expected paths
   - dependencies
   - validation
4. If the issue is ambiguous, blocked, duplicated, or missing acceptance criteria:
   - comment on the GitHub issue
   - do not hand it to engineering yet
5. If the issue contains repo-state claims, architecture-drift claims, or uncertain path references:
   - route it through `agent-repo-auditor` first
   - require a repo-reality note before engineering assignment
6. If the issue is ready:
   - create or update the corresponding Paperclip issue
   - assign it to the `CTO`
   - include the GitHub issue link and normalized task body

## Repo Auditor Workflow

`agent-repo-auditor` is a narrow support lane on `gpt-5.3-codex`.

Use it for:

- verifying that cited files and modules actually exist
- checking whether docs match the current repo state
- confirming route, path, and ownership claims
- preparing a cheap repo-reality summary before `CTO` triage

It does not:

- own final technical decisions
- own issue routing
- own feature implementation
- own merge decisions

## CTO Triage Workflow

1. Read the normalized Paperclip issue.
2. Verify the mapped area and worktree.
3. Decide the primary owner:
   - foundation
   - traveler
   - guide
   - admin
   - data
4. Add required collaborators when needed:
   - `agent-data-supabase` for shared contracts, auth, schemas, or Supabase work
   - `agent-foundation-nextjs` for shared shell, route composition, providers, or public surfaces
   - `agent-ux-designer` for major IA or cross-route UX changes
   - `agent-repo-auditor` for repo-reality verification and documentation drift checks
5. Reassign the issue to the coding lane and comment with:
   - owner
   - worktree path
   - touched paths
   - dependencies
   - expected checks

## Coding Lane Workflow

1. Work only in the assigned worktree.
2. Stay within owned paths unless the issue explicitly requires coordinated shared work.
3. Run local checks before handoff:
   - `bun run lint`
   - `bun run typecheck`
4. Report back with:
   - changed files
   - checks run
   - remaining risks

## QA Workflow

1. Review the implementation result after the coding lane reports ready.
2. Focus on:
   - regressions
   - acceptance gaps
   - cross-feature impact
   - missing validation
3. Request fixes if needed.
4. Mark ready for integration only when the issue is acceptable.

## CTO Integration Workflow

The `CTO` owns the final join-and-push process.

### Preconditions

- The implementation lane reports ready.
- `agent-qa-review` has reviewed the result.
- Dependency order is clear.

### Branch Join Procedure

1. Go to the target worktree branch.
2. Inspect status:
   - `git status --short --branch`
3. Pull latest remote refs:
   - `git fetch origin`
4. Rebase the branch on `origin/main` when appropriate:
   - `git rebase origin/main`
5. Run branch checks:
   - `bun run lint`
   - `bun run typecheck`
6. Push the branch:
   - `git push -u origin <branch>`
7. Merge into `main` locally from `/mnt/rhhd/projects/provodnik.app` in dependency order.

### Recommended Merge Order

1. `agent-data`
2. `agent-foundation`
3. `agent-traveler`
4. `agent-guide`
5. `agent-admin`

Adjust the order if a task has an explicit dependency chain.

### Local Main Integration

1. Open `/mnt/rhhd/projects/provodnik.app`
2. Update `main`:
   - `git checkout main`
   - `git pull --ff-only origin main`
3. Merge ready branches one by one:
   - `git merge --no-ff agent-data`
   - `git merge --no-ff agent-foundation`
   - `git merge --no-ff agent-traveler`
   - `git merge --no-ff agent-guide`
   - `git merge --no-ff agent-admin`
4. Run final validation on `main`:
   - `bun run lint`
   - `bun run typecheck`
   - `bun run build`
5. Push integrated `main`:
   - `git push origin main`

## Tracker Closeout Workflow

After the `CTO` pushes `main`, `Provodnik Tracker` must:

1. Comment on the GitHub issue with:
   - user-visible outcome
   - checks run
   - remaining risk
2. Update project status fields.
3. Close the issue if the acceptance criteria are met.
4. Keep live execution notes current if the work remains open or partially blocked.

## Non-Negotiable Rules

- Tracker is the only task intake lane.
- CTO is the only final integration owner.
- CTO owns stable technical docs.
- Provodnik Tracker owns live execution docs and status.
- `agent-repo-auditor` is a support lane only.
- Coding lanes do not self-merge to `main`.
- QA must review before integration.
