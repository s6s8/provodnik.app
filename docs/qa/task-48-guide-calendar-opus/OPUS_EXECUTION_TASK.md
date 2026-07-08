# Task 48 — Guide calendar availability execution packet

Workspace: `/Users/idev/provodnik-worktrees/task-48-guide-calendar-opus`
Branch: `feature/task-48-guide-calendar-opus`
Base: `origin/main` at dispatch time.

## Goal

Implement the guide-controlled calendar availability MVP from `docs/plans/task-48-guide-calendar-availability.md` in this branch.

Do **not** stop until one of these is true:

1. The branch contains a verified, committed MVP implementation with tests passing; or
2. A concrete blocker is proven in `docs/qa/task-48-guide-calendar-opus/FINAL_REPORT.md` with exact failing command/output and the smallest remaining next step.

## Required operating mode

- Use Opus-level reasoning.
- Use Superpowers before coding: `using-superpowers`, `test-driven-development`, and `verification-before-completion` where applicable.
- Use Ponytail: shortest correct implementation, reuse existing patterns, no speculative scheduling engine.
- Use Context7 before touching framework/library-sensitive code. At minimum resolve/query docs for the relevant libraries you rely on (Next.js App Router / Server Actions, Supabase JS/RLS/types, React forms/UI if needed). Record docs evidence in the final report.
- Use codebase evidence first: inspect existing `is_available`, current guide availability/admin controls, request/booking creation flows, Supabase migration patterns, tests, and RLS conventions.
- Self-evolving prompt rule: if this packet misses an implementation-critical constraint, add a short dated note to `docs/qa/task-48-guide-calendar-opus/EXECUTION_NOTES.md`, then continue. Do not expand scope; evolve only to make the current goal safer and more verifiable.

## Product source of truth

Read first:

1. `docs/plans/task-48-guide-calendar-availability.md`
2. `AGENTS.md`
3. `CLAUDE.md`
4. `.claude/CLAUDE.md`
5. Existing availability-related files found by search: `availability`, `is_available`, booking/request creation, guide profile/calendar/admin guide controls.

Core product model:

- Keep the existing global guide activity button (`is_available`) as the master self-pause switch.
- Add guide calendar blocks as a second layer: close day, date range, or time window.
- Platform/admin suspension remains separate and outranks both guide-controlled layers.
- Final availability = not platform-blocked AND globally active AND requested interval does not intersect active calendar blocks.
- Calendar blocks apply to both ready excursions/bookings and named requests to a guide.
- Tourist never sees the guide's private reason.
- Existing accepted bookings/requests are not deleted/cancelled by a newly-created block.

## Scope

Allowed:

- Product code needed for the MVP in this branch.
- Supabase migration(s), RLS policies, and generated/updated DB types when necessary.
- Tests for availability logic, server actions/data functions, and affected request/booking guards.
- Minimal guide UI in the existing guide calendar/profile area if the route already exists; otherwise create the smallest route/component consistent with project patterns.
- Documentation/report artifacts under `docs/qa/task-48-guide-calendar-opus/`.

Forbidden:

- No deployment, no remote DB push, no Vercel changes, no production data writes.
- No `git push`.
- No unrelated refactors, redesigns, or broad cleanup.
- No Tripster credentials, cookies, screenshots, or secrets in code/docs/reports.
- No custom CSS classes or inline layout styles.
- No adding a recurring rule engine in MVP unless the existing codebase already has a native reusable pattern that makes it trivial.

## Implementation expectations

Minimum MVP behavior:

- Store calendar unavailability blocks with `guide_id`, `start_at`, `end_at`, `all_day`, optional private reason, source/created_by metadata, timestamps, soft delete where practical.
- Enforce `end_at > start_at`.
- RLS: guides can manage only their own blocks; tourists cannot read private block rows directly.
- Server/data function to resolve guide availability for a given interval/date.
- Guard request/booking creation flows that can assign a guide so blocked intervals cannot be created through UI or direct action/API.
- Guide can create/delete at least:
  - whole-day block;
  - date-range block;
  - time-window block.
- Preserve existing `is_available` behavior and tests.
- Admin/support can still reason about availability/audit without mixing guide self-pausing and platform suspension.

If a full UI is too large for one safe pass, implement the backend + server guard + tests first, then add the smallest existing-pattern UI. Do not fake UI completion.

## Verification gates

Run the smallest relevant checks first, then full checks if feasible:

- targeted Vitest tests for new/changed availability logic;
- `bun run typecheck`;
- `bun run lint`;
- `bun run test:run` if practical;
- `bun run build` if practical.

If local Supabase is required but unavailable, do not fake DB proof. Record the exact blocker and verify all non-DB logic/tests that can run.

## Commit policy

- If implementation is verified enough to keep, create a local commit on this branch.
- Commit message format: `feat(guide): add calendar availability blocks`
- No automation attribution trailers.
- Do not push.

## Final report contract

Write `docs/qa/task-48-guide-calendar-opus/FINAL_REPORT.md` in Russian, UTF-8, sanitized.

Include:

- branch name and commit hash if committed;
- summary of implemented behavior;
- files changed grouped by DB/backend/UI/tests/docs;
- verification commands and actual results;
- Context7 evidence used;
- known blockers or follow-up items;
- explicit statement whether this is ready for Hermes independent verification.

Keep the report technical enough for owner review, but do not include secrets, cookies, credentials, internal session IDs, or private Tripster data.
