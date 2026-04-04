# Module Map

## Purpose
- Source of truth for module ownership, boundaries, and update rules.
- Keep this file stable and high-signal.

## Current areas
| Area | Owns | Notes |
| --- | --- | --- |
| `src/app` | Routing, layouts, route composition | App Router: `(home)` = `/`, `(site)` = public inner pages, `(protected)` = traveler/guide/admin |
| `src/features/homepage` | Legacy editorial shell (unused by `/`) | Prior landing experiment; `(home)` now composes `src/features/home` |
| `src/features/home` | Live landing sections at `/` | Glassmorphism homepage: nav, hero, gateway, destinations, how-it-works, trust, footer |
| `src/features/listings` | Public listing discovery + detail | Seeded cards, filters, and tour detail baseline |
| `src/features/traveler` | Traveler flows | Planned; route scaffold exists |
| `src/features/guide` | Guide flows | Planned; route scaffold exists |
| `src/features/admin` | Admin flows | Planned; route scaffold exists |
| `src/components/shared` | Shared app chrome | Reusable shell/UI composition |
| `src/components/providers` | App-level providers | Currently React Query provider |
| `src/components/ui` | Shared primitive UI | Treat as stable |
| `src/lib` | Shared infra and utilities | Env parsing, Supabase clients, utils |
| `src/data` | Shared contracts and backend access | Active canonical data layer |
| `src/features/shared` | Shared feature-level contracts | Planned shared feature surface |

## Dependency rules
- `src/app` may compose `src/features`, `src/components`, and `src/lib`.
- Feature modules may use `src/components/ui`, `src/components/shared`, and `src/lib`.
- Feature modules should not depend on each other directly unless a shared abstraction is promoted.
- `src/components/shared` must stay feature-agnostic.
- `src/components/ui` should stay primitive and reusable.
- Shared schemas, Supabase access, and cross-feature contracts belong in `src/data`, `src/features/shared`, or `src/lib/supabase`.

## Worktree mapping
- Foundation: `src/app`, `src/components`, `src/lib`, `src/features/homepage`, `src/features/home`
- Traveler: `src/features/traveler`, `src/app/(protected)/traveler`
- Guide: `src/features/guide`, `src/app/(protected)/guide`
- Admin: `src/features/admin`, `src/app/(protected)/admin`
- Data: `src/data`, `src/features/shared`, `src/lib/supabase`, shared schemas/types

## Update rules
- Update this file when adding a new top-level feature area, moving ownership, or changing import boundaries.
- Add an ADR for durable architecture or workflow decisions that future agents should not have to re-derive.
