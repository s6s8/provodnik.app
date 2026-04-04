# Request: phase1-run-a

Phase 1 Run A — Seed data + email/password auth foundation.

CONTEXT:
- App: Next.js 16, App Router, Supabase SSR, Tailwind CSS v4, shadcn/ui
- Auth today: demo mode only — no real Supabase Auth wired
- No middleware.ts exists yet
- No /auth route exists yet
- Existing migrations: supabase/migrations/ (6 files, tables: profiles, listings, requests, offers, bookings, reviews, notifications, disputes, conversations)
- No email server — use email+password login, NOT magic link

DELIVERABLES:

1. SEED MIGRATION (supabase/migrations/<timestamp>_seed_test_accounts.sql)
   Create 3 test accounts directly in auth.users + public.profiles + guide_profiles:

   Admin:
   - email: admin@provodnik.test
   - password: Admin1234!
   - profiles: { full_name: '??????? ???????', role: 'admin', avatar_url: 'https://i.pravatar.cc/150?u=admin', bio: '????????????? ?????????' }

   Traveler:
   - email: traveler@provodnik.test
   - password: Travel1234!
   - profiles: { full_name: '????? ???????', role: 'traveler', avatar_url: 'https://i.pravatar.cc/150?u=traveler', bio: '????? ?????????????? ?? ??????' }

   Guide:
   - email: guide@provodnik.test
   - password: Guide1234!
   - profiles: { full_name: '??????? ??????', role: 'guide', avatar_url: 'https://i.pravatar.cc/150?u=guide', bio: '????????????????? ??? ?? ????? ? ???????. 8 ??? ?????.' }
   - guide_profiles: { specialization: '??????? ? ???????', regions: ['?????', '??????', '????????'], languages: ['???????', 'English'], rating: 4.9, completed_tours: 47, verification_status: 'approved', is_available: true }

   Use pgcrypto crypt() for password hashing. Insert into auth.users with confirmed_at set. Use ON CONFLICT DO NOTHING on all inserts.
   After schema change: run bun run types to regenerate supabase.ts.

2. AUTH PAGE (src/app/auth/page.tsx + layout.tsx)
   - Email + password form with sign in / sign up toggle
   - Sign up: collect full_name + role selection (traveler / guide)
   - On sign up success: auto-insert into public.profiles with chosen role
   - On sign in success: redirect based on role:
     - traveler ? /traveler/dashboard
     - guide ? /guide/dashboard
     - admin ? /admin/dashboard
   - Use Supabase client auth (signInWithPassword / signUp)
   - Russian copy throughout
   - Use existing design tokens (globals.css CSS custom properties)
   - No inline styles, no per-component style blocks
   - Glass card layout consistent with existing pages

3. MIDDLEWARE (src/middleware.ts)
   - Protect /traveler/*, /guide/*, /admin/* — redirect to /auth if no session
   - Role guard: read profiles.role, block cross-role access (traveler blocked from /guide/*, /admin/*; guide blocked from /traveler/*, /admin/*; admin can access all)
   - Public routes (/, /destinations/*, /listings/*, /requests/*, /guides/*, /auth) pass through
   - Use Supabase SSR session check (createServerClient from @supabase/ssr)

4. PROFILE AUTO-CREATION (server action or Supabase trigger)
   - On new user signup via the auth page, ensure profiles row is created
   - Prefer a Supabase DB trigger (on insert to auth.users) as a safety net in addition to the app-side insert
   - New migration file for the trigger if needed

CONSTRAINTS:
- All styles in globals.css only — no inline style={{}} for layout
- Use CSS custom properties from :root
- No new hex colors outside :root
- Keep existing demo mode code paths intact (do not break pages that use demo data)
- bun run build must pass
- bun run typecheck must pass
- Commit with: Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
- NEVER run git push

VERIFICATION:
1. bun run build — zero errors
2. bun run typecheck — zero errors
3. /auth page renders, sign in works with seed accounts
4. Navigating to /traveler/dashboard without login redirects to /auth
5. Commit hash reported
