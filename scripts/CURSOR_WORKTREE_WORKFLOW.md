# Cursor Worktree Workflow

Planning source of truth: `IMPLEMENTATION.md`

This file defines the active multi-worktree Cursor execution model for the current issue queue.

## Goal

- run multiple implementation streams in parallel;
- keep each Cursor agent scoped to one worktree and one issue branch at a time;
- ensure all issue work stays derived from `IMPLEMENTATION.md`;
- keep the main repo as the integration and final validation point.

## Active worktrees

Use these worktrees for the active issue queue:

| Worktree | Path | First issue | Branch |
|---|---|---:|---|
| `provodnik-data` | `D:\dev\projects\provodnik\worktrees\provodnik-data` | 2 | `impl/issue-2-arch` |
| `impl-foundation` | `D:\dev\projects\provodnik\worktrees\impl-foundation` | 3 | `impl/issue-3-dark-public-shell` |
| `impl-traveler` | `D:\dev\projects\provodnik\worktrees\impl-traveler` | 13 | `impl/issue-13-traveler-dashboard` |
| `impl-guide` | `D:\dev\projects\provodnik\worktrees\impl-guide` | 15 | `impl/issue-15-guide-dashboard` |
| `impl-admin` | `D:\dev\projects\provodnik\worktrees\impl-admin` | 18 | `impl/issue-18-admin-alignment` |

## Legacy worktrees

These exist locally but are not part of the active issue workflow:

- `D:\dev\projects\provodnik\worktrees\provodnik-foundation`
- `D:\dev\projects\provodnik\worktrees\provodnik-traveler`
- `D:\dev\projects\provodnik\worktrees\provodnik-guide`
- `D:\dev\projects\provodnik\worktrees\provodnik-admin`
- `D:\dev\projects\provodnik\worktrees\provodnik-homepage-a`
- `D:\dev\projects\provodnik\worktrees\provodnik-homepage-b`

Ignore them unless you intentionally want to recover archival work.

## Global rules for every Cursor agent

Every prompt should include:

- planning source of truth: `IMPLEMENTATION.md`
- issue number and title
- exact worktree path
- exact branch name
- touched path scope
- acceptance criteria copied from the issue
- validation requirements: `bun run lint`, `bun run typecheck`
- reminder not to touch unrelated files

Default Cursor invocation rule:

```bash
cursor agent --model auto
```

Note: on this machine the available terminal entrypoint is `cursor agent`, not `cursor-agent`.

## Start sequence

1. Refresh issue mirrors:

```powershell
./scripts/pull_issues.ps1
```

2. Open one Cursor window per active worktree if you want visual parallelism:

```bash
cursor -n "D:\dev\projects\provodnik\worktrees\provodnik-data"
cursor -n "D:\dev\projects\provodnik\worktrees\impl-foundation"
cursor -n "D:\dev\projects\provodnik\worktrees\impl-traveler"
cursor -n "D:\dev\projects\provodnik\worktrees\impl-guide"
cursor -n "D:\dev\projects\provodnik\worktrees\impl-admin"
```

3. In each worktree, verify branch before delegating:

```bash
git branch --show-current
```

## Issue order by worktree

### `provodnik-data`

- `#2` `impl/issue-2-arch`

### `impl-foundation`

- `#3` `impl/issue-3-dark-public-shell`
- `#4` `impl/issue-4-shared-components`
- `#5` `impl/issue-5-dark-protected-shell`
- `#6` `impl/issue-6-requests-page`
- `#7` `impl/issue-7-request-detail`
- `#8` `impl/issue-8-create-request`
- `#9` `impl/issue-9-destination-page`
- `#10` `impl/issue-10-homepage-ctas`
- `#11` `impl/issue-11-listings-redesign`
- `#12` `impl/issue-12-guide-trust-auth`
- `#17` `impl/issue-17-integration-polish`

### `impl-traveler`

- `#13` `impl/issue-13-traveler-dashboard`
- `#14` `impl/issue-14-traveler-workspace`

### `impl-guide`

- `#15` `impl/issue-15-guide-dashboard`
- `#16` `impl/issue-16-guide-workspace`

### `impl-admin`

- `#18` `impl/issue-18-admin-alignment`

## Ready-to-use Cursor prompts

### Data worktree

```text
Workspace: D:\dev\projects\provodnik\worktrees\provodnik-data
Branch: impl/issue-2-arch
Issue: s6s8/provodnik.app-Tasks#2
Planning source of truth: IMPLEMENTATION.md
Task: Complete Phase 0 architecture alignment. Keep the active homepage feature area consistent, document route-group reality, keep request/open-request/guide-inbox mapping consistent, and finalize destination/negotiation data contracts. Follow IMPLEMENTATION.md first if any doc disagrees.
Scope: docs, src/data/destinations, src/data/negotiations, route-group docs, module map
Validate: bun run lint, bun run typecheck
Return: changed files, checks run, unresolved risks, and any follow-up issue dependencies.
```

### Foundation worktree

```text
Workspace: D:\dev\projects\provodnik\worktrees\impl-foundation
Branch: impl/issue-3-dark-public-shell
Issue: s6s8/provodnik.app-Tasks#3
Planning source of truth: IMPLEMENTATION.md
Task: Implement the current issue only. Start with the dark public marketplace shell for `(site)` routes, keeping request-first positioning and the current homepage visual family aligned. Do not do later issues in the same branch unless the acceptance criteria require a tiny supporting change.
Scope: src/app/(site), shared public chrome, marketplace shell composition
Validate: bun run lint, bun run typecheck
Return: changed files, checks run, unresolved risks, and whether the worktree is ready to move to the next branch.
```

### Traveler worktree

```text
Workspace: D:\dev\projects\provodnik\worktrees\impl-traveler
Branch: impl/issue-13-traveler-dashboard
Issue: s6s8/provodnik.app-Tasks#13
Planning source of truth: IMPLEMENTATION.md
Task: Replace the `/traveler` redirect with a real overview dashboard by composing existing traveler surfaces. Keep logic reuse high and align with the request-first marketplace model.
Scope: src/app/(protected)/traveler, src/features/traveler
Validate: bun run lint, bun run typecheck
Return: changed files, checks run, unresolved risks, and follow-up notes for issue #14.
```

### Guide worktree

```text
Workspace: D:\dev\projects\provodnik\worktrees\impl-guide
Branch: impl/issue-15-guide-dashboard
Issue: s6s8/provodnik.app-Tasks#15
Planning source of truth: IMPLEMENTATION.md
Task: Turn `/guide` into a real guide dashboard while preserving onboarding state handling. Reuse current guide surfaces and align with the shared marketplace model.
Scope: src/app/(protected)/guide, src/features/guide
Validate: bun run lint, bun run typecheck
Return: changed files, checks run, unresolved risks, and follow-up notes for issue #16.
```

### Admin worktree

```text
Workspace: D:\dev\projects\provodnik\worktrees\impl-admin
Branch: impl/issue-18-admin-alignment
Issue: s6s8/provodnik.app-Tasks#18
Planning source of truth: IMPLEMENTATION.md
Task: Build or refine the admin overview and align admin moderation/dispute pages with the protected workspace shell without hurting operator clarity.
Scope: src/app/(protected)/admin, src/features/admin
Validate: bun run lint, bun run typecheck
Return: changed files, checks run, unresolved risks, and any dependency on foundation shell work.
```

## Switching to the next issue in a worktree

Example for foundation after finishing `#3`:

```bash
git fetch origin
git checkout impl/issue-4-shared-components
git pull --ff-only origin impl/issue-4-shared-components
```

Then reuse the same prompt template with the new issue number and acceptance criteria.

## Validation model

- In each worktree branch:
  - `bun run lint`
  - `bun run typecheck`
- After merge or cherry-pick to `main`:
  - `bun run build`

## Status update loop

After each issue implementation:

1. comment on the GitHub issue with branch, changed files, checks, and remaining risks;
2. open or link the PR;
3. move project item to `Review`;
4. after merge, close the issue and switch the same worktree to its next branch.
