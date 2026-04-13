# Provodnik

Mobile-first marketplace for tours and excursions in Russia.

## Workspace

- **App repo:** `D:/dev2/projects/provodnik/provodnik.app/` ← you are here
- **Root workspace:** `D:/dev2/projects/provodnik/` — SOT files, docs, scripts, agent tooling

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Supabase (PostgreSQL + RLS + Auth)
- TanStack Query · React Hook Form · Zod
- Package manager: bun

## Quick start

```bash
bun install
cp .env.example .env.local   # fill in Supabase credentials
bun dev                      # http://localhost:3000
```

## Key commands

```bash
bun run build        # production build
bun run check        # typecheck + lint
bun run db:reset     # reset local Supabase + all migrations + seed
bun run types        # regenerate src/types/supabase.ts
```

## Status

Tripster V1 complete — all 42 waves merged, DB migrated, Vercel build green.

Remaining soft-launch items (tracked in root SOT):
- Set Vercel env vars
- Onboard 3–5 real guides
- Domain/DNS and Supabase daily backups

## Docs

All product, architecture, and business docs live in the root workspace:

- `D:/dev2/projects/provodnik/docs/product/` — MVP, PRD, market research
- `D:/dev2/projects/provodnik/docs/architecture/` — ADRs, module map
- `D:/dev2/projects/provodnik/docs/business/` — investor materials

For agent/orchestration instructions see `AGENTS.md` in this directory.
