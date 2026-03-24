# AGENTS.md

## Purpose

This folder is the orchestration root for `Provodnik`.

Do not start directly in `provodnik.app` or `provodnik.app-Tasks` when the goal is to:

- resume prior work
- recover current project state
- decide what should happen next
- route work across Paperclip, GitHub, and local repos

## Mandatory Bootstrap

When entering `D:\dev\projects\provodnik`, read these files first and in this order:

1. `D:\dev\projects\codex-ops\AGENTS.md`
2. `D:\dev\projects\codex-ops\README.md`
3. `D:\dev\projects\codex-ops\docs\workflow.md`
4. `D:\dev\projects\codex-ops\projects\provodnik\AGENTS.md`
5. `D:\dev\projects\codex-ops\projects\provodnik\project.yaml`
6. `D:\dev\projects\codex-ops\projects\provodnik\handoff.md`

Only after that should you enter the specific working repo.

## Workspace Map

- `provodnik.app`: main product codebase
- `provodnik.app-Tasks`: GitHub task ledger mirror
- `worktrees`: isolated coding worktrees
- `design`: design and scratch artifacts

## Routing

- For orchestration, resume, blockers, or "what is happening now?": use `codex-ops` first.
- For implementation: read `D:\dev\projects\provodnik\provodnik.app\AGENTS.md`.
- For task and board updates: read `D:\dev\projects\provodnik\provodnik.app-Tasks\AGENTS.md`.

## Rules

- `codex-ops` is the canonical source for durable routing and handoff state.
- `provodnik.app` is the code source of truth.
- `provodnik.app-Tasks` is the public task ledger.
- Paperclip is the execution control plane, not the canonical memory store.
- If routing, startup commands, servers, or trackers change, update `codex-ops/projects/provodnik/` before stopping.
- **UI/UX Pro Max** lives at `.cursor/skills/ui-ux-pro-max/` (shared with `provodnik.app` under its own `.cursor`). Update both with `npx uipro-cli@latest init --ai cursor` from each root. HTML/design work under `design/` uses the orchestration rule `15-ui-ux-pro-max.mdc`.
