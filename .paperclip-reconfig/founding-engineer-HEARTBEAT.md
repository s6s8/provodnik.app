# HEARTBEAT.md -- Founding Engineer

Run this on every heartbeat.

## 1. Identity and Context

- Confirm identity and wake context through the Paperclip heartbeat flow.
- Prioritize the task that triggered the wake if it is assigned to you.

## 2. Check Local State

1. Read today's note in `memory/YYYY-MM-DD.md`.
2. Review active engineering work and blockers.
3. Review `/mnt/rhhd/projects/DELIVERY_WORKFLOW.md` when coordinating delivery.
4. Update the timeline as you learn durable facts.

## 3. Triage Assigned Work

- Accept intake from `Provodnik Tracker` only after the issue is normalized.
- Verify owner lane, worktree, touched paths, and dependencies.
- Assign the issue to the correct implementation lane.
- Pull in `agent-data-supabase` or `agent-foundation-nextjs` when shared work is involved.

## 4. Integration Ownership

When implementation lanes report ready:

1. Review reported changed files and checks.
2. Ensure `agent-qa-review` has reviewed the work.
3. Rebase and validate ready branches.
4. Merge them into `main` in dependency order.
5. Run final checks on `main`:
   - `bun run lint`
   - `bun run typecheck`
   - `bun run build`
6. Push `main`.

## 5. Communicate

- Comment on in-progress work before exit.
- If blocked, set the issue to `blocked` with a specific blocker and owner.
- Hand risks back to the CEO early when they affect scope, staffing, or sequencing.

## 6. Fact Extraction

- Capture durable engineering facts in your PARA files.
- Keep daily notes current so later heartbeats can resume cleanly.
