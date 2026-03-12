# Provodnik

Provodnik is a mobile-first marketplace for tours and excursions in Russia. The current baseline is set up for parallel MVP implementation across dedicated worktrees.

## Stack

- `Next.js 16`
- `TypeScript`
- `Tailwind CSS v4`
- `shadcn/ui`
- `Supabase`
- `TanStack Query`
- `React Hook Form`
- `Zod`

## Quick start

```bash
bun install
bun dev
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The app shell works without Supabase credentials, but Supabase helper functions will throw if called before configuration.

## Project docs

- `MVP.md`: full product scope and release definition
- `PRD.md`: product requirements and market thesis
- `MARKET_RESEARCH.md`: competitor and market context
- `WORKSTREAMS.md`: branch and worktree split for parallel delivery
