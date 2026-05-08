# Design: Phase 1 — Route Protection & Role Guards

**Date:** 2026-04-01
**Covers:** PLAN items 1.2, 1.3, 1.4
**Status:** Approved

---

## What We Are Building

Three tightly coupled pieces that together enforce auth and role access across the app:

1. **Profile creation on first login (1.4)** — when a user signs up, auto-create their `profiles` row using the role from the URL param
2. **JWT custom claim** — Supabase Auth Hook bakes `role` into every JWT so middleware never queries the DB
3. **middleware.ts (1.2 + 1.3)** — single Next.js middleware file that enforces auth and role rules on all protected routes

---

## Role Model

Additive hierarchy — higher roles inherit lower access:

```
admin > guide > traveler
```

- `traveler` — access to `/traveler/*` only
- `guide` — access to `/guide/*` and `/traveler/*`
- `admin` — access to all routes

Role is stored in `public.profiles.role` and injected into the JWT via Auth Hook.

---

## Section 1 — Profile Creation on First Login (1.4)

**File:** `src/app/(auth)/auth/page.tsx` (or wherever the auth page lives — find via grep)

**Logic:**
- Read `?role=` from the URL search params. Valid values: `traveler`, `guide`. Default: `traveler`.
- On `onAuthStateChange(SIGNED_IN)`:
  - Query `profiles` for the current `user.id`
  - If no row exists (first login) → INSERT `{ id: user.id, role: role_from_url }`
  - If row exists (returning user) → skip, do not overwrite
- After profile is confirmed to exist, redirect to the appropriate dashboard:
  - `admin` → `/admin/dashboard`
  - `guide` → `/guide/dashboard`
  - `traveler` → `/traveler/dashboard`
  - If `?next=` param present → redirect there instead

**Constraints:**
- Use the existing Supabase browser client (`createBrowserClient`)
- Do not flash or redirect before the profile INSERT resolves
- CSS: no per-component `<style>` blocks — globals.css only

---

## Section 2 — JWT Custom Claim via Auth Hook

**Already configured in Supabase dashboard** (hook enabled, pointing to `public.custom_access_token_hook`).

**Migration file:** `supabase/migrations/20260401000000_auth_hook_role_claim.sql`

```sql
-- Grant auth hook access to profiles table
grant usage on schema public to supabase_auth_admin;
grant select on public.profiles to supabase_auth_admin;

-- Auth hook: inject role into JWT claims
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql security definer as $$
declare
  user_role text;
begin
  select role into user_role
    from public.profiles
   where id = (event->>'user_id')::uuid;

  if user_role is not null then
    event := jsonb_set(event, '{claims,app_metadata,role}', to_jsonb(user_role));
  end if;

  return event;
end;
$$;

grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook
  from authenticated, anon, public;
```

After this migration, every JWT contains `app_metadata.role`.

---

## Section 3 — middleware.ts (1.2 + 1.3)

**File:** `src/middleware.ts` (Next.js project root — alongside `src/app`)

**Route rules:**

| Path pattern | Auth required | Role required | Redirect if fails |
|---|---|---|---|
| `/traveler/*` | yes | any (traveler+) | `/auth?next=<url>` |
| `/guide/*` | yes | guide or admin | no session → `/auth?role=guide&next=<url>`, wrong role → `/traveler/dashboard` |
| `/admin/*` | yes | admin only | no session → `/auth`, wrong role → `/traveler/dashboard` |
| everything else | no | no | pass through |

**Implementation:**
- Use `@supabase/ssr` `createServerClient` with request/response cookies to read the session
- Read `session.user.app_metadata.role` — no DB call
- If `app_metadata.role` is absent (profile not yet created, edge case) → treat as `traveler`

**Matcher config** — only run middleware on protected paths:
```ts
export const config = {
  matcher: ['/traveler/:path*', '/guide/:path*', '/admin/:path*'],
}
```

---

## What This Does NOT Cover

- Magic link email signup (1.1) — deferred to final stage
- Role change after signup — out of scope for this phase
- Admin creation — admins are seeded directly in the DB, no signup flow

---

## Acceptance Criteria

1. New user hits `/auth?role=guide` → signs in → `profiles` row created with `role=guide` → redirected to `/guide/dashboard`
2. Logged-out user hits `/traveler/dashboard` → redirected to `/auth?next=/traveler/dashboard`
3. Traveler hits `/guide/dashboard` → redirected to `/traveler/dashboard`
4. Guide hits `/guide/dashboard` → allowed through
5. Guide hits `/traveler/dashboard` → allowed through (additive hierarchy)
6. Non-admin hits `/admin/dashboard` → redirected to `/traveler/dashboard`
7. `bun run build` passes, `bun run typecheck` passes

---

## Files to Touch

| File | Action |
|---|---|
| `supabase/migrations/20260401000000_auth_hook_role_claim.sql` | CREATE — DB hook function + grants |
| `src/middleware.ts` | CREATE — route protection + role guards |
| `src/app/(auth)/auth/page.tsx` | MODIFY — profile creation on first login + role-aware redirect |

---

## Parallel Execution

All three tasks are independent and can run as separate Codex agents simultaneously:

- **Agent 1:** Migration file (no app code dependency)
- **Agent 2:** middleware.ts (reads JWT shape from spec, no dependency on auth page)
- **Agent 3:** Auth page profile creation (no dependency on middleware)
