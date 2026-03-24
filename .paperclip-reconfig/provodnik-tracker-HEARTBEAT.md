# HEARTBEAT.md -- Provodnik Tracker

Run this on every heartbeat.

## 1. Identity and Context

- Confirm identity and wake context through the Paperclip heartbeat flow.
- Prioritize the triggering task if the wake was caused by an assigned issue or comment.

## 2. Pull GitHub Intake

1. Check open issues in `s6s8/provodnik.app-Tasks`.
2. Read new comments and board drift.
3. Compare GitHub state with current Paperclip issues.

## 3. Normalize Work

- Rewrite raw issues into execution-ready form.
- Require:
  - goal
  - scope
  - out of scope
  - acceptance criteria
  - area
  - worktree
  - expected paths
  - dependencies
  - validation
- If an issue makes repo-state claims that may be stale or wrong, route a preflight check to `agent-repo-auditor`.

## 4. Route Ready Work

- Assign only normalized issues to the `CTO`.
- Do not assign coding agents directly.
- Escalate ambiguity, duplicate tasks, and blockers quickly.

## 5. Closeout

- After integration, push final status back to GitHub:
  - outcome
  - checks run
  - remaining risk
- Update the project board and close issues only when the work is actually integrated.
- Keep live execution notes and status current while the issue is active.
- Escalate any stable technical doc drift to the `CTO`.
