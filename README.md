# Provodnik

Mobile-first marketplace for tours and excursions in Russia.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
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
bun run graph:build  # build local Graphify code graph for refactors
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
- `.claude/` — SOT, prompt skeleton, checklists

## Code graph

For refactors and cross-role bug tracing, build a local Graphify graph:

```bash
bun run graph:build
bun run graph:query -- "where are guide offers converted into bookings?"
bun run graph:path -- "acceptOfferAction()" "createBooking()"
```

Outputs stay outside the repo by default at `/tmp/provodnik-graphify/graphify-out/`. See `docs/architecture/graphify.md`.

## Orchestration

Hermes/Quantumbek in Telegram topics is the current coordination surface for Provodnik at `/Users/idev/provodnik`. Quantumbek owns thinking, planning, review, and verification without mutating product code. QuantumHands is the only executor for product-code edits. See `.claude/CLAUDE.md` for active operating rules.

## Status

Tripster V1 shipped. Pre-launch tasks tracked in `.claude/sot/NEXT_PLAN.md`.
