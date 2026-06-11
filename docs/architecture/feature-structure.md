# Architecture conventions (refactor 2026-06)

## Layering (enforced by eslint `no-restricted-imports`, task 4.1)
```
src/app/        routes, layouts, route handlers, server actions colocated per route
src/features/   feature UI + feature server actions + feature hooks/types
src/lib/        infrastructure: supabase clients, auth, env, logging, money, dates, pii, actions wrapper
src/data/       STATIC domain data + types/schemas ONLY — no network I/O
src/components/ shared UI (ui/ = shadcn primitives, shared/ = app-shared)
```
**Dependency direction (one-way):** `app → features → {lib, data, components}`. `lib`/`data` MUST NOT
import from `features` (eslint-blocked). Features import each other only via `features/shared`.

## Data access (canonical — task 4.5)
- **All Supabase I/O lives in `src/lib/supabase/<domain>.ts`** (server). This is the single convention.
- **`src/data/` holds only static domain constants, types, and zod schemas** — `interests.ts`,
  `languages.ts`, `money.ts`, `*/types.ts`, `*/schema.ts`. No `createSupabaseServerClient`, no `.from()`.
- **New code MUST follow this.** The pre-refactor codebase still has some I/O modules under `src/data/*`
  (e.g. `guide-assets/supabase-client.ts`, `guide-templates/supabase-client.ts`, `guide-offer/supabase.ts`,
  `notifications/supabase.ts`, `reviews/supabase.ts`, `supabase/queries.ts`). These are migrated to
  `src/lib/supabase/` **incrementally as each is next touched** — a one-shot bulk move was deliberately
  deferred (organizational-only, high import fan-out, no functional change, regression risk on a live app).
- `money.ts` (AP-012) is correct where it is (`src/data/money.ts`) — static helpers, never relocate casually.

## Feature directory standard (task 4.8)
```
src/features/<name>/
  actions/        'use server' files, one use-case per file + colocated *.test.ts
  components/      UI, colocated *.test.tsx
  hooks/           only when shared by 2+ components
  types.ts         feature-public types
  validation.ts    or *.schema.ts — zod schemas shared between action + form
```
- Tests colocate (no separate `tests/`/`__tests__/` for new code; existing `__tests__/` dirs are grandfathered).
- Server actions return the `ActionResult` contract from `src/lib/actions/create-action.ts` (task 3.1) for new work.

## Query/data-fetching (task 4.7)
- TanStack Query keys come from `src/lib/query-keys.ts` (factory), never ad-hoc string arrays.
- Client fetches of internal API routes go through a typed module in `src/lib/api/` (e.g. `messages.ts`),
  never inline `fetch()` in components.
