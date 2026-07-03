# CONTEXT7_NOTES.md — current-docs grounding for the refactor plan

Concise notes pulled via Context7 from current library docs. Each note names the **library + topic**
and **what recommendation in `REFACTOR_PLAN.md` it justifies**. No large doc dumps — snippets are
illustrative only.

---

## 1. Next.js App Router — Server Actions + revalidation
**Library/topic:** `/vercel/next.js` — Server Actions, `revalidatePath`, `revalidateTag`, `updateTag`, RSC `fetch` caching.

**Current guidance:**
- Mutations run in `'use server'` files; after a write, call `revalidatePath('/route')` or
  `revalidateTag('tag')` to invalidate the server cache so the next request is fresh.
- `updateTag` (Cache Components / Next 16) is the recommended primitive for **read-your-own-writes**
  ("user must see the result immediately"), expiring the tag from within the Server Action.
- Server Components fetch directly; cache intent is explicit (`force-cache` / `no-store` / `next.revalidate`).

**Justifies:**
- Standardizing every mutation on the `ActionResult` wrapper **plus** an explicit revalidation call,
  instead of ad-hoc `router.refresh()` sprinkled in components.
- A **tag taxonomy** (per-domain: `requests`, `offers`, `bookings:<id>`, …) so consolidating the data
  layer also gives coherent cache invalidation. Read-your-own-writes surfaces (offer just sent, booking
  just accepted) use `updateTag`.

## 2. Supabase SSR + RLS + typed clients
**Library/topic:** `/supabase/supabase` — `@supabase/ssr` (`createServerClient`/`createBrowserClient`, `cookies.getAll/setAll`), RLS policies, `SECURITY DEFINER` helper functions, `SupabaseClient<Database>` typing.

**Current guidance:**
- One server client factory using `getAll`/`setAll` cookie adapters; the `setAll`-from-RSC throw is
  expected and ignored when middleware refreshes sessions (matches the app's `src/lib/supabase/*`).
- Authorization belongs in **RLS policies**; expensive/role checks are wrapped in a
  `security definer` helper (e.g. `is_room_participant(room_id)`, `has_good_role()`) and referenced
  from the policy — this both centralizes and speeds up the check.
- Type safety via `SupabaseClient<Database>` from generated types; service functions should accept a
  typed client argument.

**Justifies:**
- The core move: **collapse the 3 data conventions to one** (`src/lib/supabase/<domain>.ts`, typed
  client in, no `.from()` in `src/data` or components). Directly supported by "I/O in one place, typed."
- Pushing app-layer `.eq(owner=me)` scoping (26 in `/guide`, 15 in `/admin`) **down into RLS +
  `security definer` participant/role helpers**, rather than trusting app filters — the docs' exact pattern.
- Keeps `SECURITY DEFINER` as a *named, auditable* surface (helper functions), not scattered service-role reads.

## 3. React 19 — form actions & pending/optimistic state
**Library/topic:** `/reactjs/react.dev` — `useActionState`, `useFormStatus`, `useOptimistic`, `use`.

**Current guidance:**
- `useActionState(action, initial)` returns `[state, formAction, isPending]`; `useFormStatus().pending`
  drives submit-button disabling; `useOptimistic` gives instant UI feedback; `use(promise)` reads a
  promise in a client component under Suspense.

**Justifies:**
- A single **form contract**: RHF+Zod for field validation → Server Action returning `ActionResult`
  → `useActionState`/`isPending` for submission state. This replaces the mixed ad-hoc return shapes and
  gives the "god" form components (bid-form-panel 639 LOC, request/booking detail screens ~1000 LOC) a
  uniform mutation pattern to decompose against.
- Zod schema is defined once and shared by the action and the RHF resolver (kills validation duplication).

## 4. TanStack Query — query-key factory + RSC hydration
**Library/topic:** `/tanstack/query` — query-key factories, `invalidateQueries` key semantics, `dehydrate`/`HydrationBoundary` prefetch.

**Current guidance:**
- Prefetch in a Server Component (`prefetchQuery`/`fetchQuery`) → `dehydrate(queryClient)` →
  `HydrationBoundary` in a client child. Invalidation is prefix-based: `['todos']` invalidates
  `['todos', {…}]` too, so **structured, hierarchical keys** are essential.

**Justifies:**
- The plan's requirement that all keys come from `src/lib/query-keys.ts` (factory), never inline arrays —
  so invalidation after a Server Action mutation is predictable and matches the Next.js revalidation tags.
- Server-prefetch + hydrate for interactive lists (inbox/offers, messages, admin tables) instead of
  `useEffect` fetching.

## 5. Playwright — role auth reuse + setup projects
**Library/topic:** `/microsoft/playwright` — `storageState`, setup-project dependency, worker-scoped auth, multi-role contexts.

**Current guidance:**
- A `setup` project authenticates once and writes `storageState` per role
  (`playwright/.auth/{traveler,guide,admin}.json`); test projects depend on it and `test.use({ storageState })`.
- Multi-user flows open one context per role in a single test (traveler + guide + admin), ideal for the
  request→offer→accept→review→dispute handshake.

**Justifies:**
- The test strategy: before any data-layer move, add **role-based E2E** covering the critical
  request-first flow across roles, using per-role `storageState`, so refactors have a real safety net.
  This is the coverage precondition for every `SAFE-AFTER-TESTS` / `ADAPTER-REWRITE` item.

---

### How these map to the phased plan
- **Phase 0 (coverage first):** Playwright role fixtures + critical-flow E2E (note 5) → unlocks later phases.
- **Phase 1 (enforce boundaries):** eslint rule banning `.from()`/`createServerClient` in `src/data/**`
  and components; query-key factory (note 4). Non-behavioral.
- **Phase 2 (data-layer consolidation):** one Supabase convention + typed clients (note 2), incremental
  per-domain moves behind the new lint gate.
- **Phase 3 (RLS hardening):** app-layer scoping → RLS + `security definer` helpers (note 2).
- **Phase 4 (forms/actions):** `ActionResult` + `useActionState` + shared Zod + revalidation tags (notes 1,3).
