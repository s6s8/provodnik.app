# Paperclip Agent Contract

## Purpose

This file defines how Paperclip should orchestrate `provdonik.app` delivery from design docs through GitHub issues, worktrees, implementation, integration, and Slack-facing dev notes.

## Source Priority

Use this order when deriving or updating work:

1. `AGENTS.md`
2. `IMPLEMENTATION.md`
3. `design/IMPLEMENTATION-GUIDE.md`
4. `design/STAKEHOLDER-FEEDBACK.md`
5. `design/LAYOUT.md`
6. `docs/process/orchestration-workflow.md`
7. `.cursor/rules/*.mdc`

If the design docs introduce requirements that older issues or helper files do not yet reflect, update the issues and helper docs before assigning coding work.

## Role Split

### CEO

- approves the active program direction
- approves or creates agent roles
- can request a full task breakdown from the design docs

### Provodnik Tracker

- normalizes GitHub issues
- keeps GitHub Project and Paperclip issue state aligned
- assigns execution-ready work to the CTO
- comments on GitHub with progress, blockers, checks, and closeout status

### CTO

- owns the technical task tree after tracker normalization
- maps work to worktrees and lane ownership
- decides dependency order
- delegates coding tasks to executor lanes
- owns integration ordering and final readiness judgment
- updates stable workflow and architecture docs when durable changes are made

### Cursor Executors

- implement one scoped issue at a time in one assigned worktree
- follow `.cursor/rules/*.mdc`
- do not self-assign unrelated tasks
- return changed files, checks run, blockers, and unresolved risks

### Codex Review Or Integration Lanes

- verify implementation claims
- reconcile GitHub, Paperclip, and repo-doc drift
- own final integration commentary and durable documentation changes

## Delivery Loop

1. Tracker reads the design docs and current repo state.
2. Tracker creates or updates GitHub issues so each task is concrete and executable.
3. Tracker creates or updates matching Paperclip issues and assigns them to the CTO.
4. CTO assigns the correct lane and worktree.
5. Executor implements in the scoped worktree.
6. CTO or Codex review lane validates the result.
7. Tracker updates GitHub state and comments.
8. CTO handles integration ordering and final closeout.

## Design-Derived Requirements To Preserve

- Homepage uses dual-entry architecture: exchange plus ready-made tours.
- Request-first CTA order is fixed:
  1. create request
  2. find group
  3. explore destinations
- Request cards and destination surfaces must include region context, not city alone.
- Listing detail must support itinerary travel segments and transport options.
- Request detail must support price scenarios tied to changing group size.
- Destination detail must include local guides as a first-class section.
- Protected traveler surfaces must be rebuilt to the same dark premium system, not left as an older shell.

## Slack Dev Notes

- Local source of truth: `D:\dev\projects\codex-ops\projects\provodnik\dev-notes.md`
- Slack is a mirror, not the source of truth.
- Every meaningful implementation update should append a short local dev note and then mirror it into Slack when bot auth is available.
- Do not report Slack updates as completed if Slack auth is unavailable.

## Safety

- Do not close GitHub issues just because a Paperclip subtask is done.
- Do not route implementation from stale issue text when the design docs have evolved.
- Do not let helper files diverge from the active plan and issue queue.
