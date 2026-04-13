Follow `AGENTS.md` first, then any matching `.github/instructions/*.instructions.md`.

Full docs, SOT files, and architecture notes live in the root workspace at `D:/dev2/projects/provodnik/docs/`.

Use the smallest coherent change that solves the task.

Respect module boundaries:
- `src/app` composes routes and layouts.
- `src/features/*` owns feature UI and feature logic.
- `src/components/ui/*` is stable shared UI.
- `src/lib/*` owns env, utils, and shared infrastructure.

Do not edit `src/components/ui/*` unless the task is shared-foundation work.

Keep the shell runnable without Supabase env unless the task explicitly requires configured backend flows.

When architecture, ownership, or conventions change, update the matching source-of-truth docs:
- `AGENTS.md` in this repo
- `D:/dev2/projects/provodnik/docs/architecture/module-map.md`
- `.github/CODEOWNERS`
- `D:/dev2/projects/provodnik/docs/architecture/adr/` for durable decisions

Do not store temporary task status in repo memory files. Live progress belongs in issues, pull requests, or GitHub Projects.
