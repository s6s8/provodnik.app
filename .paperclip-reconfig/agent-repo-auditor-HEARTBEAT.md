# HEARTBEAT.md -- agent-repo-auditor

Run this on every heartbeat.

## 1. Identity and Context

- Confirm identity and wake context through the Paperclip heartbeat flow.
- Prioritize the triggering issue or verification request.

## 2. Verify Repo Reality

1. Read the cited issue or request.
2. Inspect the repo paths that the issue claims exist or changed.
3. Check whether the relevant docs match the code.

## 3. Report

- Return concise findings with exact paths.
- Separate:
  - confirmed
  - missing
  - ambiguous
- Hand durable doc drift to the `CTO`.
- Hand issue-state drift to `Provodnik Tracker`.
