# PROJECT_MAP.md — Provodnik Project Structure

_Generated: 2026-04-06 | Updated: 2026-05-11 (Phase 7 — orchestrator runtime path canonicalised)_

## Status
- **Tripster V1:** COMPLETE — all 42 waves merged, DB migrated, Vercel build green
- **Site:** LIVE at https://provodnik.app (Vercel auto-deploy from origin/main)
- **Current HEAD:** 41c0877
- **Feature flags:** 14 flags under FEATURE_TR_* prefix (see docs/tripster-v1-rollout.md)
- **Next:** Vercel env vars (.claude/set-vercel-env.sh), onboard guides, soft launch

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Database:** Supabase (PostgreSQL + RLS)
- **Auth:** Supabase Auth + demo session cookie
- **Package manager:** bun (NEVER npm/yarn)

## App Root
- **Mini (orchestrator runtime, canonical):** `/Users/idev/projects/provodnik.app/`
- **Win (developer mirror):** `D:/dev2/projects/provodnik.app/`

When the orchestrator passes this map to a stage, it injects the Mini path
because the Cursor SDK wrapper and tool-access (`--add-dir`) run on the Mac mini.

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

## Screen Registry (dev.provodnik.app)

Naming convention: Parent-Child-SubLevel via dash separators. Each dash = one nav level deeper.

| Код | URL | Описание |
|-----|-----|---------|
| Г-Главная | `/guide` | Гид — главная |
| Г-Входящие | `/guide/inbox` | Гид — входящие запросы |
| Г-Входящие-Карточка | карточка внутри Г-Входящие | Входящие — карточка-превью |
| Г-Входящие-Карточка-Детали | `/guide/inbox/[id]` | Входящие — детали запроса |
| Г-Экскурсии | `/guide/excursions` | Гид — мои экскурсии |
| Г-Профиль | `/guide/profile` | Гид — профиль (верификация, лицензии, данные) |
| Г-Верификация | `/guide/verification` | Редирект → Г-Профиль#verification; используется в уведомлениях и CTA |
| П-Главная | `/traveler` | Путешественник — главная |
| П-Запросы | `/traveler/requests` | Путешественник — мои запросы |
| П-Запросы-Новый | `/traveler/requests/new` | Путешественник — создать запрос |
| П-Запросы-Детали | `/traveler/requests/[id]` | Путешественник — детали запроса |
| П-Бронь-Детали | `/traveler/bookings/[id]` | Путешественник — бронирование |
| А-Главная | `/admin` | Админ — главная |
| А-Гиды | `/admin/guides` | Админ — список гидов |
| А-Модерация | `/admin/moderation` | Админ — модерация |
| А-Споры | `/admin/disputes` | Админ — споры |
| А-Бронирования | `/admin/bookings` | Админ — бронирования |
| Проф-Личное | `/profile/personal` | Профиль — личные данные |
| Проф-Гид | `/profile/guide/about` | Профиль — данные гида |
| Каталог | `/requests` | Каталог запросов (публичный) |
| Гид-Публичный | `/guides/[slug]` | Публичный профиль гида |
