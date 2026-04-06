# PROJECT_MAP.md — Provodnik Project Structure

_Generated: 2026-04-06 | Updated: 2026-04-06 (phase-8-complete)_

## Status
- **Phase 8 audit fixes:** COMPLETE — all 13 findings fixed (A1–A3, B2–B6, C1–C4, C6)
- **Site:** LIVE at https://provodnik.app (HTTP 200, Vercel auto-deploy from origin/main)
- **Current HEAD:** 97169ac
- **Phase 10.1:** IN PROGRESS — feat/guides-in-city subagent running

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Database:** Supabase (PostgreSQL + RLS)
- **Auth:** Supabase Auth + demo session cookie
- **Package manager:** bun (NEVER npm/yarn)

## App Root
`/mnt/rhhd/projects/provodnik/provodnik.app/`

## Build Commands
```
bun dev            # dev server
bun run build      # production build (use to verify before commit)
bun run typecheck  # TS check
bun run lint       # ESLint
bun run check      # typecheck + lint
bun run db:reset   # reset local Supabase + apply all migrations + seed
bun run types      # regenerate src/types/supabase.ts
```

## Key Directories
```
src/
├── app/
│   ├── (auth)/              # login/register pages
│   ├── (protected)/         # authenticated workspace pages
│   │   ├── traveler/        # traveler workspace
│   │   ├── guide/           # guide workspace
│   │   ├── admin/           # admin workspace
│   │   ├── messages/        # messaging
│   │   └── notifications/   # notifications
│   └── (site)/              # public marketing pages
├── components/
│   ├── shared/              # shared layout components (SiteHeader, WorkspaceRoleNav, etc.)
│   └── ui/                  # shadcn/ui components
├── data/
│   └── supabase/queries.ts  # ALL public data queries (getDestinations, getListings, etc.)
├── features/                # feature-specific components/screens
│   ├── auth/                # auth screens
│   ├── destinations/        # destination detail screen
│   ├── guide/               # guide onboarding + dashboard features
│   └── traveler/            # traveler dashboard + request screens
└── lib/
    ├── auth/                # server-auth.ts, role-routing.ts, types.ts
    ├── supabase/            # server.ts (createSupabaseServerClient), client.ts
    └── demo-session.ts      # demo mode cookie helpers

supabase/
└── migrations/
    ├── 20260401000001_schema.sql               # full schema
    ├── 20260401000002_seed.sql                 # seed data (safe to re-run)
    ├── 20260401000003_auth_hook_role_claim.sql
    └── 20260406000001_listings_image_url.sql   # adds image_url TEXT column to listings

## Key New Files (audit-fixes session)
- `src/components/shared/breadcrumbs.tsx` — BreadcrumbsNav server component (C6)
- `src/components/shared/breadcrumbs-client.tsx` — client wrapper using usePathname (C6)
- `src/features/traveler/components/traveler-dashboard-screen-stats.tsx` — real traveler dashboard (B3)
- `src/features/guide/components/dashboard/guide-dashboard-screen.tsx` — real guide dashboard with verification gate (B4)
- `src/app/(protected)/guide/settings/page.tsx` — guide onboarding/profile settings page (B4)
- `src/features/guide/components/public/public-guide-card.tsx` — public guide card used on destination pages (Phase 10.1)
```

## Key Patterns
- Protected pages fetch auth via: `const auth = await readAuthContextFromServer()`
- Authenticated Supabase client: `await createSupabaseServerClient()` then `supabase.auth.getUser()`
- Glass card: `bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass`
- shadcn/ui: Badge, Button, Card, CardContent, CardHeader, CardTitle are all available
- Metadata template: `title: { default: "Provodnik — ...", template: "%s — Provodnik" }` in root layout

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (anon key)
- `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY` (for server-side reads)

## Entry Points
- Auth: `src/app/(auth)/auth/page.tsx`
- Protected layout: `src/app/(protected)/layout.tsx`
- Root layout: `src/app/layout.tsx`

## Seed Test Accounts
- `admin@provodnik.test` / Admin1234! (admin)
- `traveler@provodnik.test` / Travel1234! (traveler)
- `guide@provodnik.test` / Guide1234! (guide, id: 30000000-0000-4000-8000-000000000001)
- `guide@provodnik.app` / Demo1234! (guide demo, id: 00000000-0000-4000-8000-000000000002)
