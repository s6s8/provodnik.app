# 0001: Repo memory layout

## Status
- Accepted

## Context
- Agents should not re-scan the whole repo to recover basic context.
- Repo memory must stay cheap to load and hard to stale out.
- Live task status changes faster than architecture and coding rules.

## Decision
- Keep stable instructions in `AGENTS.md`, `.github/copilot-instructions.md`, `.github/instructions/*.instructions.md`, and `docs/architecture/module-map.md`.
- Record durable workflow or architecture choices in `docs/adr/*`.
- Track live progress in issues, pull requests, and GitHub Projects instead of static markdown memory files.

## Consequences
- Agents can load a small set of high-signal files first.
- Stable docs must be updated when ownership or architecture changes.
- Temporary progress notes should not accumulate in long-lived memory files.
