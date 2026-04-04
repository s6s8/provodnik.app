# Tasks: phase1-run-a
date: 2026-03-31
total: 23

## Phase 1: Foundation
<Schema changes, seed migrations, and shared routing/type foundations that must land before auth logic and UI wiring>

- [x] **T01** — `supabase/migrations/20260331120000_phase1_auth_foundation.sql`: add `guide_profiles` Phase 1 fields and replace `public.handle_new_user()` so signup always converges to one base profile and one minimal guide profile.
  - Spec: Signup Profile Provisioning; Guide Seed Data Coverage; Guide Signup Defaults; Profile Trigger Safety Net
  - Accept: Migration adds `specialization`, `rating`, `completed_tours`, and `is_available`; preserves safe defaults/checks; and the trigger upserts `profiles` plus inserts one minimal `guide_profiles` row for guide signups.

- [x] **T02** — `supabase/migrations/20260331121000_phase1_auth_seed_accounts.sql`: create the deterministic Phase 1 auth/profile/guide seed migration as its own timestamped migration instead of relying only on `supabase/seed.sql`.
  - Spec: Seeded Test Accounts; Guide Seed Data Coverage
  - Accept: Migration inserts deterministic admin, traveler, and guide auth rows plus matching profile rows with `ON CONFLICT DO NOTHING`, and the guide seed persists specialization, regions, languages, rating, completed tours, verification status, and availability.

- [x] **T03** — `package.json`: fix the Supabase type-generation scripts so `bun run types` regenerates the app-used output path instead of the currently unused `src/types/supabase.ts`.
  - Spec: Guide Seed Data Coverage; non-goal-safe support for regenerated Supabase types
  - Accept: `types` and `types:remote` point at the file path consumed by the app’s Supabase layer, and no script still targets `src/types/supabase.ts`.

- [x] **T04** — `src/lib/auth/role-routing.ts`: add the shared role-routing source of truth for canonical dashboard paths, role-to-path redirects, and pathname-to-required-role resolution.
  - Spec: Role Dashboard Destinations; Role-Aware Workspace Enforcement; Direct Requests To Legacy Role Roots
  - Accept: The helper exposes canonical `/traveler/dashboard`, `/guide/dashboard`, and `/admin/dashboard` destinations plus required-role lookup for traveler/guide/admin protected paths.

- [x] **T05** — `src/lib/supabase/middleware.ts`: add the middleware-safe Supabase session helper for cookie-aware request auth reads.
  - Spec: Middleware Protection For Role Workspaces; Role-Aware Workspace Enforcement
  - Accept: Middleware can create a Supabase client without breaking cookie reads/writes and without depending on page-only server helpers.

- [x] **T06** — `src/lib/auth/types.ts`: extend the auth contract for canonical redirect handling and missing-role recovery without breaking the existing demo-mode shape.
  - Spec: Missing Role On An Authenticated Account; Authenticated Visit To The Account Page; Demo Mode Contract
  - Accept: The auth types can represent known-role, missing-role, and redirect-target decisions needed by middleware and the `/auth` entry flow.

## Phase 2: Access Control And Auth Logic
<Middleware, auth context normalization, and credential flow wiring>

- [x] **T07** — `src/lib/auth/server-auth.ts`: normalize server auth reads around the new role-routing helpers and missing-role handling while preserving demo fallback when Supabase is absent.
  - Spec: Demo Mode Contract; Missing Role On An Authenticated Account; Authenticated Visit To The Account Page
  - Accept: Server auth resolution returns stable role information for known users, does not silently grant workspace access to missing-role accounts, and still falls back to demo cookies when Supabase env is absent.

- [x] **T08** — `src/middleware.ts`: enforce guest gating and role-aware redirects for `/traveler/*`, `/guide/*`, and `/admin/*`, with demo-mode support when Supabase is unavailable.
  - Spec: Middleware Protection For Role Workspaces; Role-Aware Workspace Enforcement; Demo Session With Protected Routes
  - Accept: Guests are redirected to `/auth`, mismatched roles are redirected to their canonical dashboard, and demo-role requests still resolve to the matching demo workspace when Supabase env is absent.

- [x] **T09** — `src/app/(site)/auth/page.tsx`: redirect already-authenticated users to their canonical dashboard and update the shell copy away from magic-link framing while keeping the existing glass-card page structure.
  - Spec: Account Entry Experience; Authenticated Visit To The Account Page; Role Dashboard Destinations
  - Accept: Known authenticated roles no longer stay on `/auth`, and the rendered guest shell describes credential login plus demo fallback in Russian.

- [x] **T10** — `src/features/auth/components/auth-entry-screen.tsx`: replace OTP-only submission with Russian-language email/password sign-in and sign-up modes, inline validation, role selection on sign-up, and post-auth dashboard routing.
  - Spec: Email And Password Auth Entry; Invalid Credentials; Duplicate Sign-Up Email; Role Dashboard Destinations
  - Accept: Guests can sign in with email/password, sign up with email/password plus role/full-name inputs, see inline success/error states, and land on `/traveler/dashboard`, `/guide/dashboard`, or `/admin/dashboard` after a successful authenticated flow.

## Phase 3: UI And Route Surfaces
<Canonical dashboard routes, legacy-root shims, and workspace navigation updates>

- [x] **T11** — `src/app/(protected)/traveler/dashboard/page.tsx`: add the canonical traveler dashboard route and render the existing traveler dashboard surface there.
  - Spec: Role Dashboard Destinations; Direct Requests To Legacy Role Roots
  - Accept: `/traveler/dashboard` resolves as the traveler workspace entry and renders the same primary screen currently used for the traveler dashboard experience.

- [x] **T12** — `src/app/(protected)/traveler/page.tsx`: change the traveler root into a redirect shim to `/traveler/dashboard`.
  - Spec: Direct Requests To Legacy Role Roots; Role Dashboard Destinations
  - Accept: Visiting `/traveler` issues a redirect to `/traveler/dashboard` instead of landing on `/traveler/requests`.

- [x] **T13** — `src/app/(protected)/guide/dashboard/page.tsx`: add the canonical guide dashboard route and render the existing guide onboarding/dashboard entry there.
  - Spec: Role Dashboard Destinations; Guide Defaults For Self-Signup
  - Accept: `/guide/dashboard` resolves as the guide workspace entry and renders the current guide entry surface without requiring extra onboarding data at sign-up time.

- [x] **T14** — `src/app/(protected)/guide/page.tsx`: change the guide root into a redirect shim to `/guide/dashboard`.
  - Spec: Direct Requests To Legacy Role Roots; Role Dashboard Destinations
  - Accept: Visiting `/guide` issues a redirect to `/guide/dashboard`.

- [x] **T15** — `src/app/(protected)/admin/dashboard/page.tsx`: add the canonical admin dashboard route and render the existing admin review queue there.
  - Spec: Role Dashboard Destinations
  - Accept: `/admin/dashboard` resolves as the admin workspace entry and renders the current admin queue surface.

- [x] **T16** — `src/app/(protected)/admin/page.tsx`: change the admin root into a redirect shim to `/admin/dashboard`.
  - Spec: Direct Requests To Legacy Role Roots; Role Dashboard Destinations
  - Accept: Visiting `/admin` issues a redirect to `/admin/dashboard`.

- [x] **T17** — `src/components/shared/workspace-role-nav.tsx`: update workspace role navigation links and copy to use canonical dashboard targets and reflect strict RBAC instead of soft role mismatch access.
  - Spec: Role Dashboard Destinations; Role-Aware Workspace Enforcement; Demo Session With Protected Routes
  - Accept: Traveler/guide/admin role tabs point to `/traveler/dashboard`, `/guide/dashboard`, and `/admin/dashboard`, and the mismatch messaging no longer claims cross-role access is acceptable in MVP.

## Phase 4: Data Types And Local Schema Sync
<Align app types with the new schema and regenerate the actual generated artifact>

- [x] **T18** — `src/lib/supabase/types.ts`: extend the app-facing guide profile type surface for `specialization`, `rating`, `completed_tours`, and `is_available`.
  - Spec: Guide Seed Data Coverage; Guide Signup Defaults
  - Accept: `GuideProfileRow` and any dependent exported aliases include the new persisted guide fields with safe TypeScript shapes.

- [ ] **T19** — Run `bun run db:reset`
  - Spec: Seeded Test Accounts; Guide Seed Data Coverage; Signup Profile Provisioning
  - Accept: The local Supabase schema is rebuilt with the new Phase 1 migrations applied, including the separate auth seed migration.

- [ ] **T20** — Run `bun run types`
  - Spec: Guide Seed Data Coverage; regenerated app type surface stays aligned with schema changes
  - Accept: The configured generated type file is rewritten at the app-used path after the schema reset, and the command succeeds without writing to the obsolete path.

## Phase 5: Validation
<Repo checks that exist in package.json and must pass before the change can be verified>

- [ ] **T21** — Run `bun run lint`
  - Spec: validation only
  - Accept: ESLint exits cleanly with no remaining errors for the implemented Phase 1 auth foundation changes.

- [x] **T22** — Run `bun run build`
  - Spec: validation only
  - Accept: Next.js production build completes successfully with the new auth, middleware, dashboard-route, and type-generation changes in place.

- [x] **T23** — Run `bun run typecheck`
  - Spec: validation only
  - Accept: TypeScript exits cleanly after the regenerated Supabase types and updated auth routing surfaces are in place.









