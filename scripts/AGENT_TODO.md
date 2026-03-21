# Agent implementation TODO (full list)

**Planning source of truth:** `IMPLEMENTATION.md`.  
**Operational source:** `s6s8/provodnik.app-Tasks` issues #2–#18.  
**Refresh issues:** run `./scripts/pull_issues.ps1` (or see scripts/README-issues.md).  
**Work in parallel:** use the worktrees below; one Cursor window per worktree.

This file is a local execution mirror only. If its order or wording disagrees with `IMPLEMENTATION.md`, update this file to match the plan.

---

## Checklist (track locally; close issue in GitHub when done)

| Done | # | Phase | Title | Worktree | Branch |
|:---:|---|-------|------|----------|--------|
| ☐ | 2 | 0 | Architecture alignment — homepage, route groups, data mapping | provodnik-data | `impl/issue-2-arch` |
| ☐ | 3 | 1 | Dark public marketplace shell | impl-foundation | `impl/issue-3-dark-public-shell` |
| ☐ | 4 | 1 | Shared marketplace components | impl-foundation | `impl/issue-4-shared-components` |
| ☐ | 5 | 1 | Dark protected workspace shell | impl-foundation | `impl/issue-5-dark-protected-shell` |
| ☐ | 6 | 2 | Public Requests marketplace page (/requests) | impl-foundation | `impl/issue-6-requests-page` |
| ☐ | 7 | 2 | Public Request detail page (/requests/[requestId]) | impl-foundation | `impl/issue-7-request-detail` |
| ☐ | 8 | 2 | Public Create request page (/requests/new) | impl-foundation | `impl/issue-8-create-request` |
| ☐ | 9 | 2 | Destination page (/destinations/[slug]) | impl-foundation | `impl/issue-9-destination-page` |
| ☐ | 10 | 2 | Homepage request-first CTAs and flow | impl-foundation | `impl/issue-10-homepage-ctas` |
| ☐ | 11 | 3 | Redesign Listings discovery and detail | impl-foundation | `impl/issue-11-listings-redesign` |
| ☐ | 12 | 3 | Redesign Guide profile; align Trust/Auth/policies | impl-foundation | `impl/issue-12-guide-trust-auth` |
| ☐ | 13 | 4 | Traveler dashboard (real /traveler overview) | impl-traveler | `impl/issue-13-traveler-dashboard` |
| ☐ | 14 | 4 | Traveler workspace visual alignment | impl-traveler | `impl/issue-14-traveler-workspace` |
| ☐ | 15 | 5 | Guide dashboard (real /guide overview) | impl-guide | `impl/issue-15-guide-dashboard` |
| ☐ | 16 | 5 | Guide workspace alignment | impl-guide | `impl/issue-16-guide-workspace` |
| ☐ | 17 | 7 | Integration and polish | impl-foundation | `impl/issue-17-integration-polish` |
| ☐ | 18 | 6 | Admin overview and visual alignment | impl-admin | `impl/issue-18-admin-alignment` |

---

## Worktree paths (for parallel work)

| Worktree | Path | Issues (in order) |
|----------|------|-------------------|
| **provodnik-data** | `D:\dev\projects\provodnik\worktrees\provodnik-data` | 2 |
| **impl-foundation** | `D:\dev\projects\provodnik\worktrees\impl-foundation` | 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 17 |
| **impl-traveler** | `D:\dev\projects\provodnik\worktrees\impl-traveler` | 13, 14 |
| **impl-guide** | `D:\dev\projects\provodnik\worktrees\impl-guide` | 15, 16 |
| **impl-admin** | `D:\dev\projects\provodnik\worktrees\impl-admin` | 18 |

---

## Dependency order (phases)

- **Phase 0:** #2 (do first; data/arch baseline).
- **Phase 1:** #3, #4, #5 (shells and shared components; can overlap after #2).
- **Phase 2:** #6 → #7 → #8, #9, #10 (requests + destination + homepage CTAs).
- **Phase 3:** #11, #12 (listings + guide/trust/auth).
- **Phase 4:** #13, #14 (traveler).
- **Phase 5:** #15, #16 (guide).
- **Phase 6:** #18 (admin).
- **Phase 7:** #17 (integration; do after main streams merge).

---

## Quick commands (from app repo root)

```powershell
# Pull latest issues from GitHub into scripts/open-issues.json and open-issues.md
./scripts/pull_issues.ps1

# In a worktree: switch to next issue (e.g. in impl-foundation after finishing #3)
git fetch origin
git checkout impl/issue-4-shared-components

# Before PR from worktree
bun run lint
bun run typecheck
```

---

## Updating GitHub issues

See `scripts/README-issues.md` for: pull issues, close with comment, add label, move on project board.
