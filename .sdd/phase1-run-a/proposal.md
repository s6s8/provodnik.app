# Proposal: phase1-run-a
date: 2026-03-31
status: draft

## Intent
Phase 1 Run A replaces the current magic-link auth entry with a real Supabase email/password foundation while preserving Provodnik's existing demo-mode behavior. The goal is to make seeded test accounts, role-aware sign-in, protected workspaces, and signup profile creation work together without breaking the current public shell or protected demo flows that still need to function when Supabase is not configured.

## Scope
### In Scope
- Replace the current `/auth` magic-link experience with an email/password sign-in and sign-up flow in Russian copy.
- Add seed migration(s) for deterministic admin, traveler, and guide test accounts.
- Introduce middleware-based route protection for `/traveler/*`, `/guide/*`, and `/admin/*` with role-aware redirects.
- Preserve existing demo-mode fallback paths when Supabase environment variables are absent.
- Harden profile auto-creation by aligning the app-side signup flow with the existing `public.handle_new_user()` trigger on `auth.users`.
- Regenerate Supabase types after schema changes.

### Out of Scope
- Payment integration or any non-auth Phase 1 work.
- Redesign of the broader public-site visual language beyond the auth entry shell.
- Reworking shared UI primitives under `src/components/ui`.
- Large data-model expansion beyond what is required to support the requested seed data and profile safety net.

## Approach Options

### Option A: Extend the current auth foundation in place
Replace the existing `/auth` page implementation in `src/app/(site)/auth/page.tsx`, swap `AuthEntryScreen` from OTP to email/password modes, add demo-aware middleware, and add targeted migrations for seeded users plus any trigger/schema hardening required for signup safety.
**Pros:** Reuses the current route and existing auth helpers; keeps visual continuity with the current glass-card page; preserves the demo-mode contract by building on `readAuthContextFromServer()` and existing Supabase helpers; minimizes routing churn because `/auth` already exists via the `(site)` route group; fits the request with the smallest coherent change set.
**Cons:** Requires careful coordination between middleware, server auth helpers, and existing protected layouts; still needs a decision on how to map requested guide seed fields that do not match the current `guide_profiles` schema.

### Option B: Add a parallel auth stack and phase out the current one later
Create a new dedicated auth feature surface and supporting server actions, keep the current magic-link UI temporarily, and add middleware plus seed work around the new stack before later removing the legacy entry.
**Pros:** Lower risk of destabilizing the current `/auth` page while building the new flow; easier to isolate new logic during implementation.
**Cons:** Creates duplicate auth paths and temporary dead weight; conflicts with the request's goal of establishing the real auth foundation now; increases cleanup work in later phases; adds avoidable ambiguity about which auth entry is canonical.

### Option C: Seed and gate only, defer full signup/signin replacement
Ship only the seed migration, middleware protection, and minimal sign-in support for the seeded accounts, while leaving broader sign-up/profile creation behavior for a later run.
**Pros:** Smallest implementation footprint; fastest path to basic protected-area access for seeded users.
**Cons:** Fails the requested deliverables for sign-up, profile auto-creation, and replacing magic-link behavior; leaves the app in a mixed auth state; pushes critical behavior into a later phase without reducing long-term complexity.

## Recommendation
Option A because the repository already has the right structural pieces in place: `/auth` exists, browser/server Supabase helpers exist, the protected shell already reads a demo-aware auth context, and `public.handle_new_user()` already provides a database safety net. The right move is to harden and extend the current path rather than fork it or defer key auth behavior.

## Affected Areas
- `.sdd/phase1-run-a/*` downstream spec/design/task artifacts
- `src/app/(site)/auth/page.tsx`
- `src/app/(site)/auth/layout.tsx` if a route-local shell is needed
- `src/features/auth/components/auth-entry-screen.tsx`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/auth/server-auth.ts`
- `src/middleware.ts` (new)
- `supabase/migrations/*` for seeded accounts and possible trigger/schema updates
- `src/types/supabase.ts` or the repo’s generated Supabase type outputs after `bun run types`

## Rollback Plan
If the new auth foundation causes regressions, revert the new middleware and auth UI changes first so protected areas fall back to the current server-side demo-aware shell behavior. Then revert the new migration(s) in a follow-up corrective migration rather than editing historical migrations, remove the seeded users/profiles/guide profile rows, and restore the prior magic-link auth entry component. Because the current trigger already exists in the initial migration, any trigger changes should be isolated to a new migration so they can be rolled back cleanly.

## Open Questions
- The request specifies guide seed fields `specialization`, `rating`, `completed_tours`, and `is_available`, but the current `public.guide_profiles` schema uses `specialties` and does not contain those other columns. Should this run add those columns, translate only the compatible fields into existing columns, or seed equivalent values elsewhere?
- Should successful authenticated visits to `/auth` immediately redirect to the role dashboard, or should the page remain accessible and only redirect after form submission?
