# Workstreams

These worktrees are intended for parallel MVP implementation from the shared baseline commit.

## Local paths

- primary repo: `D:\dev\projects\provodnik\provodnik.app`
- worktrees root: `D:\dev\projects\provodnik\worktrees`

## Tracking model

- GitHub Issues hold task records and acceptance criteria.
- GitHub Project holds live status such as `Ready`, `In Progress`, `Blocked`, `Review`, and `Done`.
- Worktrees isolate code changes per stream; they do not replace issue tracking.

## Branch split

### `agent-foundation`

Scope:

- shared app shell;
- auth boundary and route protection;
- shared design system wrappers;
- providers and app-level configuration;
- homepage and public route primitives.

Primary paths:

- `src/app`
- `src/components`
- `src/lib`

### `agent-traveler`

Scope:

- traveler profile;
- request creation flow;
- request detail;
- booking list and booking detail;
- favorites and traveler account UX.

Primary paths:

- `src/features/traveler`
- `src/app/(protected)/traveler`

### `agent-guide`

Scope:

- guide onboarding;
- verification intake UX;
- listing manager;
- request inbox;
- offer creation flow;
- guide booking operations.

Primary paths:

- `src/features/guide`
- `src/app/(protected)/guide`

### `agent-admin`

Scope:

- moderation queues;
- dispute management;
- refund operations;
- supply controls;
- marketplace analytics surfaces.

Primary paths:

- `src/features/admin`
- `src/app/(protected)/admin`

### `agent-data`

Scope:

- Supabase schema planning;
- typed data access;
- route handlers and mutations;
- validation schemas;
- query keys and shared server data contracts.

Primary paths:

- `src/data`
- `src/lib/supabase`
- `src/features/shared`

## Rules

- `agent-foundation` owns shared layout decisions.
- Feature branches should avoid editing `src/components/ui/*`.
- Shared type and contract changes should be coordinated through `agent-data`.
- Rebase from `main` before opening merge requests between worktrees.
- Use worktree `lint` and `typecheck` for fast branch checks.
- Run final `bun run build` on `main` after merge, because the shared-install worktree setup is not Turbopack-safe for build validation.
