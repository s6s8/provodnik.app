# Design: phase1-run-a
date: 2026-03-31
stack: Next.js 16 App Router + Supabase SSR + Tailwind CSS v4 + shadcn/ui + bun

## Architecture Decision
Keep the canonical account route at `src/app/(site)/auth/page.tsx` because `(site)` is a pathless route group and already owns `/auth`; creating `src/app/auth/*` would duplicate the same public URL and risk breaking the existing site shell. Add a top-level `src/middleware.ts` for pre-render auth/role enforcement only when Supabase env is present, while preserving the current demo-cookie fallback when env is absent. Introduce explicit dashboard leaf routes under each protected role (`/traveler/dashboard`, `/guide/dashboard`, `/admin/dashboard`) and make the existing role roots redirect there. Extend `public.guide_profiles` with the missing seeded-guide fields instead of renaming existing `specialties`, so current guide-facing code keeps working while Phase 1 gets the requested auth and seed fidelity.

## Files to Create
| File | Purpose |
|---|---|
| `src/middleware.ts` | Pre-render auth protection for `/auth`, `/traveler/:path*`, `/guide/:path*`, and `/admin/:path*`, with env-aware demo fallback and role redirects. |
| `src/lib/auth/role-routing.ts` | Shared helpers for mapping roles to dashboard paths and workspace prefixes so auth page, middleware, and protected layouts use one source of truth. |
| `src/app/(protected)/traveler/dashboard/page.tsx` | Canonical traveler post-auth destination; immediately redirects to the existing traveler requests workspace. |
| `src/app/(protected)/guide/dashboard/page.tsx` | Canonical guide dashboard route that renders the existing guide onboarding/dashboard screen. |
| `src/app/(protected)/admin/dashboard/page.tsx` | Canonical admin dashboard route that renders the existing admin review queue. |
| `supabase/migrations/20260331120000_phase1_auth_foundation.sql` | Schema extension for `guide_profiles`, trigger hardening for signup profile creation, and deterministic seeded auth/profile records. |

## Files to Modify
| File | What Changes |
|---|---|
| `src/app/(site)/auth/page.tsx` | Keep the current route, but add server-side redirect for authenticated users with a recognized role and update page copy to match email/password auth. |
| `src/features/auth/components/auth-entry-screen.tsx` | Replace OTP-only flow with Russian-language email/password sign-in and sign-up modes, role selection on sign-up, inline error/success states, and demo fallback messaging when env is absent. |
| `src/lib/auth/server-auth.ts` | Centralize role lookup around shared route helpers and keep demo-cookie fallback only when Supabase env is unavailable or no Supabase session exists. |
| `src/lib/supabase/server.ts` | Export a middleware-safe server client creator or the cookie adapter needed by `src/middleware.ts` so SSR and middleware use the same Supabase session semantics. |
| `src/lib/supabase/client.ts` | Keep browser client creation but support credential auth flows used by the new auth form and sign-out flow. |
| `src/app/(protected)/layout.tsx` | Assume middleware has already enforced entry, but still read auth context for shell chrome and safe fallback rendering in demo mode. |
| `src/app/(protected)/traveler/page.tsx` | Redirect `/traveler` to `/traveler/dashboard` instead of `/traveler/requests`. |
| `src/app/(protected)/guide/page.tsx` | Redirect `/guide` to `/guide/dashboard` so the root path stays valid after dashboard route introduction. |
| `src/app/(protected)/admin/page.tsx` | Redirect `/admin` to `/admin/dashboard` so the root path stays valid after dashboard route introduction. |
| `src/components/shared/workspace-role-nav.tsx` | Change role-switch links to dashboard URLs, remove “soft mismatch” messaging, and make sign-out clear Supabase auth when a real session exists. |
| `package.json` | Fix `types` and `types:remote` output paths so generated Supabase types land in the existing `src/lib/supabase` location used by the repo. |
| `src/lib/supabase/database.types.ts` | Replace the current hand-maintained mismatch with generated Supabase output. |
| `src/lib/supabase/types.ts` | Keep app-friendly aliases/wrappers, but extend `GuideProfileRow` and any related aliases to include the new guide profile fields. |

## Files to Delete
| File | Reason |
|---|---|
| none | none |

## Data Flow
1. A guest requests `/auth`. `src/app/(site)/auth/page.tsx` reads `readAuthContextFromServer()`.
2. If Supabase env is configured and the visitor already has a valid session plus a recognized `profiles.role`, the page redirects to `getDashboardPathForRole(role)` from `src/lib/auth/role-routing.ts`.
3. If no active session exists, `AuthEntryScreen` renders two credential modes:
   - sign in: `supabase.auth.signInWithPassword({ email, password })`
   - sign up: `supabase.auth.signUp({ email, password, options: { data: { role, full_name } } })`
4. During sign-up, the existing `public.handle_new_user()` trigger upserts `public.profiles` and, for guides, creates a minimal `public.guide_profiles` row with safe defaults for specialization, rating, completed tours, availability, languages, and regions.
5. After sign-in or sign-up succeeds, the client refreshes auth state, resolves the role from `profiles`, and routes the user to `/traveler/dashboard`, `/guide/dashboard`, or `/admin/dashboard`.
6. `src/middleware.ts` runs before any protected traveler/guide/admin route. When Supabase env exists, it loads the session, fetches the user role from `public.profiles`, and:
   - redirects guests to `/auth`
   - redirects role mismatches to the correct dashboard
   - redirects missing-role accounts back to `/auth?error=missing-role`
7. When Supabase env is absent, middleware falls back to `provodnik_demo_session` and applies the same role-to-workspace mapping so existing local demo access keeps working.
8. Legacy root requests (`/traveler`, `/guide`, `/admin`) resolve through small redirect pages to the new dashboard destinations, preserving old links while establishing one canonical post-auth target per role.

## API Changes
No custom JSON/API endpoints are added.

Route behavior changes:
- `GET /auth`: same public URL, but now redirects authenticated users to their role dashboard and renders email/password auth for guests.
- `GET /traveler/dashboard`: new canonical traveler dashboard route; redirects to the existing requests workspace.
- `GET /guide/dashboard`: new canonical guide dashboard route.
- `GET /admin/dashboard`: new canonical admin dashboard route.
- `GET /traveler`, `GET /guide`, `GET /admin`: remain valid, but become redirect shims to the matching dashboard route.

## Schema Changes
Phase 1 should be implemented in a new migration, not by editing `20260312130000_initial_marketplace.sql`.

```sql
alter table public.guide_profiles
  add column if not exists specialization text,
  add column if not exists rating numeric(2,1) not null default 0.0,
  add column if not exists completed_tours integer not null default 0,
  add column if not exists is_available boolean not null default false;

update public.guide_profiles
set specialization = coalesce(specialization, specialties[1])
where specialization is null
  and coalesce(array_length(specialties, 1), 0) > 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'guide_profiles_rating_check'
  ) then
    alter table public.guide_profiles
      add constraint guide_profiles_rating_check
      check (rating >= 0 and rating <= 5);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'guide_profiles_completed_tours_check'
  ) then
    alter table public.guide_profiles
      add constraint guide_profiles_completed_tours_check
      check (completed_tours >= 0);
  end if;
end $$;
```

`public.handle_new_user()` should be replaced in the same migration so self-signup and repeated provisioning converge to one `profiles` row and one safe `guide_profiles` row:

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  role_text text;
  desired_role public.app_role;
  derived_name text;
  guide_specialization text;
begin
  role_text := coalesce(new.raw_user_meta_data ->> 'role', 'traveler');
  desired_role := case
    when role_text = 'guide' then 'guide'::public.app_role
    when role_text = 'admin' then 'admin'::public.app_role
    else 'traveler'::public.app_role
  end;
  derived_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    split_part(coalesce(new.email, ''), '@', 1)
  );
  guide_specialization := nullif(new.raw_user_meta_data ->> 'specialization', '');

  insert into public.profiles (id, role, email, full_name, avatar_url)
  values (
    new.id,
    desired_role,
    new.email,
    derived_name,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
    set role = excluded.role,
        email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name),
        avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
        updated_at = timezone('utc', now());

  if desired_role = 'guide' then
    insert into public.guide_profiles (
      user_id,
      display_name,
      specialization,
      specialties,
      regions,
      languages,
      rating,
      completed_tours,
      is_available
    )
    values (
      new.id,
      derived_name,
      guide_specialization,
      case
        when guide_specialization is null then '{}'::text[]
        else array[guide_specialization]
      end,
      '{}'::text[],
      '{}'::text[],
      0.0,
      0,
      false
    )
    on conflict (user_id) do update
      set display_name = coalesce(public.guide_profiles.display_name, excluded.display_name),
          specialization = coalesce(public.guide_profiles.specialization, excluded.specialization),
          specialties = case
            when coalesce(array_length(public.guide_profiles.specialties, 1), 0) = 0
              then excluded.specialties
            else public.guide_profiles.specialties
          end,
          updated_at = timezone('utc', now());
  end if;

  return new;
end;
$$;
```

Seeded auth users should be created in the same migration with deterministic UUIDs and confirmed email/password credentials, then completed with profile-safe upserts:

```sql
do $$
declare
  admin_id uuid := '10000000-0000-4000-8000-000000000001';
  traveler_id uuid := '20000000-0000-4000-8000-000000000001';
  guide_id uuid := '30000000-0000-4000-8000-000000000001';
begin
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  values
    (
      '00000000-0000-0000-0000-000000000000',
      admin_id,
      'authenticated',
      'authenticated',
      'admin@provodnik.app',
      crypt('Provodnik123!', gen_salt('bf')),
      timezone('utc', now()),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"role":"admin","full_name":"Provodnik Admin"}'::jsonb,
      timezone('utc', now()),
      timezone('utc', now())
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      traveler_id,
      'authenticated',
      'authenticated',
      'traveler@provodnik.app',
      crypt('Provodnik123!', gen_salt('bf')),
      timezone('utc', now()),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"role":"traveler","full_name":"Test Traveler"}'::jsonb,
      timezone('utc', now()),
      timezone('utc', now())
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      guide_id,
      'authenticated',
      'authenticated',
      'guide@provodnik.app',
      crypt('Provodnik123!', gen_salt('bf')),
      timezone('utc', now()),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"role":"guide","full_name":"Test Guide","specialization":"Исторические прогулки"}'::jsonb,
      timezone('utc', now()),
      timezone('utc', now())
    )
  on conflict (id) do update
    set email = excluded.email,
        encrypted_password = excluded.encrypted_password,
        raw_user_meta_data = excluded.raw_user_meta_data,
        updated_at = timezone('utc', now());

  update public.profiles
  set full_name = case id
      when admin_id then 'Provodnik Admin'
      when traveler_id then 'Test Traveler'
      when guide_id then 'Test Guide'
      else full_name
    end
  where id in (admin_id, traveler_id, guide_id);

  insert into public.guide_profiles (
    user_id,
    display_name,
    specialization,
    specialties,
    regions,
    languages,
    rating,
    completed_tours,
    verification_status,
    is_available
  )
  values (
    guide_id,
    'Test Guide',
    'Исторические прогулки',
    array['Исторические прогулки'],
    array['Москва'],
    array['ru', 'en'],
    4.9,
    128,
    'approved'::public.guide_verification_status,
    true
  )
  on conflict (user_id) do update
    set display_name = excluded.display_name,
        specialization = excluded.specialization,
        specialties = excluded.specialties,
        regions = excluded.regions,
        languages = excluded.languages,
        rating = excluded.rating,
        completed_tours = excluded.completed_tours,
        verification_status = excluded.verification_status,
        is_available = excluded.is_available,
        updated_at = timezone('utc', now());
end $$;
```

No new RLS policies are required for this phase because the current owner/admin policies still cover `guide_profiles`; the new columns inherit the table’s existing read/write rules.

## Component Architecture
- `src/app/(site)/auth/page.tsx`
  - Server component.
  - Reads auth context and immediately redirects recognized authenticated users to their dashboard.
  - Continues to render the current two-column marketing shell so the site visual language is preserved.
- `src/features/auth/components/auth-entry-screen.tsx`
  - Remains the single auth card component, but now owns a local `mode: "sign-in" | "sign-up"` state, `email`, `password`, optional `fullName`, `role`, submission status, and inline feedback.
  - Uses `createSupabaseBrowserClient()` for credential auth rather than adding custom API endpoints or server actions.
  - In sign-up mode, role selection is visible and required; in sign-in mode, role selection is hidden because the stored profile role is authoritative.
- `src/lib/auth/role-routing.ts`
  - Exposes pure helpers such as `getDashboardPathForRole(role)`, `getWorkspacePrefixForRole(role)`, and `resolveRedirectRole(role)`.
  - Used by middleware, auth page redirects, post-auth client navigation, and workspace chrome links.
- Dashboard routes
  - `traveler/dashboard/page.tsx`: redirect-only shim to the existing traveler requests experience.
  - `guide/dashboard/page.tsx`: wraps `GuideOnboardingScreen`.
  - `admin/dashboard/page.tsx`: wraps `GuideReviewQueue`.

## State Management
- Client state
  - `AuthEntryScreen` keeps local form values, mode toggle, pending state, and inline error/success copy in React state.
- Server/session state
  - Supabase auth cookies remain the source of truth when env is configured.
  - `provodnik_demo_session` remains the fallback source of truth only when Supabase env is absent.
- Database state
  - `public.profiles.role` remains authoritative for workspace access and redirect decisions.
  - `public.guide_profiles` stores the new seed/default fields: `specialization`, `rating`, `completed_tours`, and `is_available`, while preserving `specialties` for existing UI compatibility.
- Generated types
  - `package.json` should point generation to `src/lib/supabase/database.types.ts`.
  - `src/lib/supabase/types.ts` remains the stable app-facing adapter layer that re-exports or reshapes the generated database types for feature code.

## Decisions & Rationale
| Decision | Why |
|---|---|
| Keep `/auth` implemented in `src/app/(site)/auth/page.tsx` | `(site)` is pathless, so this already owns `/auth`; adding `src/app/auth/page.tsx` would create route duplication and bypass the existing public shell. |
| Create explicit `/traveler/dashboard`, `/guide/dashboard`, `/admin/dashboard` pages | The spec requires those destinations, and creating real pages avoids ambiguous redirects from auth/middleware while preserving old root links through small redirect shims. |
| Make `traveler/dashboard` redirect to `/traveler/requests` | The existing traveler “dashboard” is already the requests screen, so redirecting keeps current UX intact and avoids duplicating traveler UI. |
| Move current guide/admin root screens to dashboard URLs conceptually, with root pages becoming redirects | This satisfies the requested dashboard destinations without changing the visible content of the guide and admin workspaces. |
| Add `specialization`, `rating`, `completed_tours`, and `is_available` instead of replacing `specialties` | Existing app code already uses `specialties`; removing it would create unnecessary churn. Adding the requested fields gives seed fidelity while keeping backward compatibility. |
| Treat `specialization` as the seeded/self-signup summary field and keep `specialties` as the compatibility array | The request asked for a singular specialization field, but the current UI/data layer already expects an array. Storing both avoids a breaking rename in Phase 1. |
| Correct Supabase type generation to `src/lib/supabase/database.types.ts` | The current scripts write to `src/types/supabase.ts`, which is not used by the repo; generating into the existing `src/lib/supabase` location fixes drift with the smallest change. |
| Do not add custom Next.js API routes or server actions for auth | Supabase browser auth already handles credential flows; using it keeps this phase smaller and aligned with the current client-side auth entry component. |
| Honor demo access only when Supabase env is absent in middleware | This matches the spec’s explicit fallback contract and prevents demo cookies from becoming an auth bypass once real auth is configured. |

## Risks
- Seeding `auth.users` in SQL is sensitive to Supabase auth schema expectations; implementation must validate the inserted column set against the local Supabase version before claiming success.
- Middleware and SSR session handling must share compatible cookie adapters; otherwise login can succeed client-side while middleware still sees the request as unauthenticated.
- Changing `src/lib/supabase/database.types.ts` from a hand-maintained file to generated output can break any code that relied on the current incorrect shape; `src/lib/supabase/types.ts` must absorb compatibility reshaping.
- Traveler currently treats `/traveler/requests` as the first-class workspace. Redirect loops must be avoided by keeping the chain one-way: `/traveler` -> `/traveler/dashboard` -> `/traveler/requests`.
