# Provodnik

Mobile-first marketplace for tours and excursions in Russia.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Supabase (PostgreSQL + RLS + Auth)
- TanStack Query · React Hook Form · Zod
- Package manager: `bun`

## Quick start

```bash
bun install
cp .env.example .env.local   # fill in Supabase + Sentry credentials
bun dev                      # http://localhost:3000
```

## Key commands

```bash
bun run build        # production build
bun run check        # typecheck + lint
bun run typecheck    # TS only
bun run lint         # ESLint only
bun run test:run     # vitest unit tests
bun run playwright   # e2e suite
bun run db:reset     # reset local Supabase + all migrations + seed
bun run types        # regenerate src/types/supabase.ts
```

## Layout

- `src/app/` — routes + layouts (App Router)
- `src/features/` — feature UI per role (home, listings, traveler, guide, admin)
- `src/components/{ui,shared}/` — shadcn primitives + shared chrome
- `src/data/` — service layer (typed Supabase client, server+client)
- `src/lib/` — env, utils, Supabase clients, feature flags
- `supabase/migrations/` — schema migrations (apply via `bun run db:reset` locally; via Supabase CLI in prod)
- `tests/` — vitest unit + Playwright e2e
- `docs/` — product, architecture, business, design, qa, superpowers (specs + plans)
- `.claude/` — orchestrator SOT, prompt skeleton, checklists

## Orchestration

Telegram (`@QuantumBekBot`, app `provodnik`) is the canonical control surface. See `.claude/CLAUDE.md` for the full ticket flow and hand-edit conventions.

## Status

Tripster V1 shipped. Pre-launch tasks tracked in `.claude/sot/NEXT_PLAN.md`.
