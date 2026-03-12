Follow `AGENT.md` first, then `docs/architecture/module-map.md`, then any matching `.github/instructions/*.instructions.md`.

Use the smallest coherent change that solves the task.

Respect module boundaries:
- `src/app` composes routes and layouts.
- `src/features/*` owns feature UI and feature logic.
- `src/components/ui/*` is stable shared UI.
- `src/lib/*` owns env, utils, and shared infrastructure.

Do not edit `src/components/ui/*` unless the task is shared-foundation work.

Keep the shell runnable without Supabase env unless the task explicitly requires configured backend flows.

When architecture, ownership, or conventions change, update the matching source-of-truth docs:
- `AGENT.md`
- `docs/architecture/module-map.md`
- `.github/CODEOWNERS`
- `docs/adr/*` for durable decisions

Do not store temporary task status in repo memory files. Live progress belongs in issues, pull requests, or GitHub Projects.
