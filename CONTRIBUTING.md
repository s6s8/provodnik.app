# Contributing

## Before You Start

- read `AGENTS.md`
- read the relevant docs under `docs/`
- keep changes scoped to one concrete outcome

## Development Flow

1. Create or pick a tracked issue.
2. Work in the correct worktree or branch for that area.
3. Make the smallest coherent change that solves the issue.
4. Update source-of-truth docs when conventions or architecture change.
5. Open a pull request with validation notes and remaining risks.

## Local Checks

Run the checks that match the change:

- `bun run lint`
- `bun run typecheck`
- `bun run build` for routing, framework, or config changes

## Pull Requests

- link the issue
- describe the user-facing or system outcome
- call out anything intentionally left out
- note risks, blockers, or follow-up work

## Security

Do not commit secrets, production credentials, or private customer data.

If you discover a security issue, follow [`SECURITY.md`](.github/SECURITY.md) instead of filing a public issue.
