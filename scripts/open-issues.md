# Open implementation issues (pulled from s6s8/provodnik.app-Tasks)

Refreshed by: `./scripts/pull_issues.ps1`

Planning source of truth: `IMPLEMENTATION.md`

This file is only a cached issue view. If issue ordering or wording drifts from `IMPLEMENTATION.md`, fix the issue records and regenerate this file.

## By worktree (for simultaneous work)

Use these worktrees to work on multiple issues in parallel (each in its own Cursor window or terminal):

| Worktree path | Branch | Issue |
|---------------|--------|--------|
| `D:\dev\projects\provodnik\worktrees\provodnik-data` | `impl/issue-2-arch` | #2 Phase 0 Architecture |
| `D:\dev\projects\provodnik\worktrees\impl-foundation` | `impl/issue-3-dark-public-shell` | #3 Phase 1 Dark public shell |
| `D:\dev\projects\provodnik\worktrees\impl-traveler` | `impl/issue-13-traveler-dashboard` | #13 Phase 4 Traveler dashboard |
| `D:\dev\projects\provodnik\worktrees\impl-guide` | `impl/issue-15-guide-dashboard` | #15 Phase 5 Guide dashboard |
| `D:\dev\projects\provodnik\worktrees\impl-admin` | `impl/issue-18-admin-alignment` | #18 Phase 6 Admin |

**Other branches (switch in same worktree when done with current issue):**  
Foundation: `git checkout impl/issue-4-shared-components` ... `impl/issue-17-integration-polish`. Traveler: `impl/issue-14-traveler-workspace`. Guide: `impl/issue-16-guide-workspace`.

## All open issues (by phase)

| # | Phase | Title |
|---|-------|--------|
| 2 | 0 | [Phase 0] Architecture alignment — homepage, route groups, data mapping |
| 3 | 1 | [Phase 1] Dark public marketplace shell |
| 4 | 1 | [Phase 1] Shared marketplace components |
| 5 | 1 | [Phase 1] Dark protected workspace shell |
| 6 | 2 | [Phase 2] Public Requests marketplace page (/requests) |
| 7 | 2 | [Phase 2] Public Request detail page (/requests/[requestId]) |
| 8 | 2 | [Phase 2] Public Create request page (/requests/new) |
| 9 | 2 | [Phase 2] Destination page (/destinations/[slug]) |
| 10 | 2 | [Phase 2] Homepage request-first CTAs and flow |
| 11 | 3 | [Phase 3] Redesign Listings discovery and detail |
| 12 | 3 | [Phase 3] Redesign Guide profile and align Trust/Auth/policies |
| 13 | 4 | [Phase 4] Traveler dashboard (real /traveler overview) |
| 14 | 4 | [Phase 4] Traveler workspace visual alignment |
| 15 | 5 | [Phase 5] Guide dashboard (real /guide overview) |
| 16 | 5 | [Phase 5] Guide workspace alignment |
| 17 | 7 | [Phase 7] Integration and polish |
| 18 | 6 | [Phase 6] Admin overview and visual alignment |
## Running worktrees in parallel

1. Open one Cursor window (or terminal) per worktree:
   - `D:\dev\projects\provodnik\worktrees\provodnik-data` â†’ Issue #2
   - `D:\dev\projects\provodnik\worktrees\impl-foundation` â†’ Issue #3
   - `D:\dev\projects\provodnik\worktrees\impl-traveler` â†’ Issue #13
   - `D:\dev\projects\provodnik\worktrees\impl-guide` â†’ Issue #15
   - `D:\dev\projects\provodnik\worktrees\impl-admin` â†’ Issue #18

2. To switch to another issue in the same worktree (e.g. in impl-foundation do #4 next):
   `git checkout impl/issue-4-shared-components`

3. Run dev: from **main repo** `bun dev`; or from inside a worktree run `bun install` once then `bun dev`.

4. Validate before PR: `bun run lint`, `bun run typecheck` in the worktree; after merge run `bun run build` on main.

## Full agent TODO

See `scripts/AGENT_TODO.md` for the full checklist, dependency order, and quick commands.

## Cursor workflow

See `scripts/CURSOR_WORKTREE_WORKFLOW.md` for split-worktree Cursor execution commands.
