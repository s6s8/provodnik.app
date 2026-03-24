# Provodnik Team

## Purpose

This document defines the active multi-agent operating model for `provodnik.app`.

- Task source of truth: `s6s8/provodnik.app-Tasks`
- Live status board: GitHub Project `Provodnik`
- Code repo: `/mnt/rhhd/projects/provodnik.app`
- Coding runtime: `cursor-agent --model auto`
- Thinking, review, and orchestration runtime: `codex_local` with `gpt-5.4`

## Org Chart

- `CEO`
  - `CTO`
    - `Provodnik Tracker`
    - `agent-repo-auditor`
    - `agent-foundation-nextjs`
    - `agent-traveler`
    - `agent-guide`
    - `agent-admin-trust`
    - `agent-data-supabase`
    - `agent-ux-designer`
    - `agent-qa-review`

## Runtime Split

### `codex_local` on `gpt-5.4`

- `CEO`
- `CTO`
- `Provodnik Tracker`
- `agent-ux-designer`
- `agent-qa-review`

### `codex_local` on `gpt-5.3-codex`

- `agent-repo-auditor`

### `cursor-agent --model auto`

- `agent-foundation-nextjs`
- `agent-traveler`
- `agent-guide`
- `agent-admin-trust`
- `agent-data-supabase`

## Worktree Mapping

- `agent-foundation-nextjs`: `/mnt/rhhd/projects/worktrees/provodnik-foundation`
- `agent-traveler`: `/mnt/rhhd/projects/worktrees/provodnik-traveler`
- `agent-guide`: `/mnt/rhhd/projects/worktrees/provodnik-guide`
- `agent-admin-trust`: `/mnt/rhhd/projects/worktrees/provodnik-admin`
- `agent-data-supabase`: `/mnt/rhhd/projects/worktrees/provodnik-data`

## Repo-Scoped Support Lanes

- `agent-repo-auditor`: `/mnt/rhhd/projects/provodnik.app`

## Role Definitions

1. `Provodnik Tracker`
   - Owns GitHub issue intake.
   - Monitors `s6s8/provodnik.app-Tasks` and the GitHub Project.
   - Normalizes issues before engineering picks them up.
   - Pushes execution status back to the tracker.

2. `CTO`
   - Owns technical triage and sequencing.
   - Chooses the primary implementation lane.
   - Decides when shared data, auth, or shell work must be coordinated.

3. `agent-repo-auditor`
   - Owns cheap repo verification and preflight audits.
   - Verifies that issue claims match the current repo state before implementation starts.
   - Scans for documentation drift, missing paths, and stale assumptions.
   - Does not own final decisions or broad implementation.

4. `agent-foundation-nextjs`
   - Owns `src/app`, `src/components`, `src/lib`, and shared shell decisions.

5. `agent-traveler`
   - Owns traveler-facing protected flows.

6. `agent-guide`
   - Owns guide onboarding, request handling, and guide bookings.

7. `agent-admin-trust`
   - Owns moderation, disputes, refunds, and admin trust surfaces.

8. `agent-data-supabase`
   - Owns `src/data`, `src/lib/supabase`, migrations, shared schemas, and contracts.

9. `agent-ux-designer`
   - Owns UX direction, IA, flow specs, and design critique.
   - Should not be the default implementation lane.

10. `agent-qa-review`
   - Owns review, regression analysis, release risk, and acceptance validation.
   - Should not be the default implementation lane.

## Assignment Rules

- `Provodnik Tracker` is the only GitHub task intake lane.
- Every issue must be cleaned before assignment:
  - goal
  - scope
  - out of scope
  - acceptance criteria
  - area
  - worktree
  - expected paths
  - dependencies
- `CTO` assigns engineering ownership after issue cleanup.
- Any schema, auth, or shared contract change requires `agent-data-supabase`.
- Any shared shell, route composition, provider, or public-surface change requires `agent-foundation-nextjs`.
- `agent-ux-designer` should shape large cross-route UX work before coding starts.
- `agent-qa-review` validates completed work before final acceptance.
- `agent-repo-auditor` should be used when an issue contains repo-state claims, missing-path claims, or documentation drift signals.

## Documentation Ownership

- `CTO` owns stable technical documentation.
- `Provodnik Tracker` owns live execution documentation and status updates.

### `CTO` owns

- engineering runbooks
- merge and integration workflow
- stable team operating model
- technical process docs
- durable architecture and ownership updates

### `Provodnik Tracker` owns

- GitHub issue hygiene
- board status updates
- execution comments
- task normalization artifacts
- live delivery status and closeout notes

## Correct Workflow

1. `Provodnik Tracker` reads `s6s8/provodnik.app-Tasks` and creates or updates the matching Paperclip issue.
2. `CTO` reviews the issue and decides owner, dependencies, and touched paths.
3. The selected coding agent works in its dedicated `srvx` worktree using `cursor-agent --model auto`.
4. If the task changes schema, auth, or shared contracts, `agent-data-supabase` is mandatory.
5. `agent-qa-review` on `gpt-5.4` reviews behavior, risks, missing validation, and acceptance quality.
6. `Provodnik Tracker` pushes status and outcome back to the GitHub issue and board.
7. `CEO` handles staffing, priority, and escalations only.

## Integration Rule

- The `CTO` is the final integration owner.
- The `CTO` is responsible for:
  - reviewing completed implementation branches
  - merging them into `main` in dependency order
  - running the final validation pass on `main`
  - pushing the integrated result upstream

## Repo Inputs

- `provodnik.app/AGENTS.md`
- `provodnik.app/WORKSTREAMS.md`
- `provodnik.app/docs/architecture/module-map.md`
- `provodnik.app/docs/process/orchestration-workflow.md`
- `provodnik.app/.cursor/rules/*.mdc`
