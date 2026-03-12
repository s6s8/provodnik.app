# Supabase Backend Setup

## Current project
- Project ref: `yjzpshutgmhxizosbeef`
- Hosted URL is configured locally through `.env.local`
- Repo now contains:
  - `supabase/config.toml`
  - `supabase/migrations/20260312130000_initial_marketplace.sql`
  - `supabase/migrations/20260312133000_storage_and_media.sql`
  - `supabase/migrations/20260312134000_conversations_and_events.sql`
  - `supabase/migrations/20260312135000_moderation_and_public_views.sql`
  - `src/lib/supabase/admin.ts`
- The initial schema has been uploaded to the hosted Supabase project.

## Key model
- Browser key:
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Server key:
  - `SUPABASE_SECRET_KEY`
- Legacy aliases are still accepted by the app:
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Remaining secret needed
- The hosted database password is still required for CLI schema operations.
- The direct connection string in the project settings must be completed with the real password:
  - `SUPABASE_DB_PASSWORD=...`
- The secret API key is not the database password.

## Recommended next commands
1. Install the Supabase CLI.
2. Authenticate the CLI.
3. Link this repo to the hosted project:
   - `supabase link --project-ref yjzpshutgmhxizosbeef`
   - If prompted, provide `SUPABASE_DB_PASSWORD`
4. Push the migration:
   - `supabase db push`
   - apply all local migrations in timestamp order
5. Generate database types after the schema is live:
   - `supabase gen types typescript --linked --schema public > src/lib/supabase/database.types.ts`

## Current machine state
- The repo has the migration locally.
- The hosted schema is already uploaded.
- This machine still needs `supabase login` or `SUPABASE_ACCESS_TOKEN` to:
  - link the repo
  - inspect remote migration state
  - generate DB types from the hosted schema

## Launch-critical backend phases after schema push
1. Replace the demo session with real Supabase auth.
2. Persist traveler requests, open-request joins, offers, and bookings.
3. Persist favorites, reviews, notifications, and disputes.
4. Add storage buckets and policies for guide verification documents.
5. Add payment integration only after the non-payment loops are stable.

## Migration sequence in repo
1. `20260312130000_initial_marketplace.sql`
   - core auth-linked marketplace entities and RLS
2. `20260312133000_storage_and_media.sql`
   - storage buckets, guide docs, listing media, dispute evidence
3. `20260312134000_conversations_and_events.sql`
   - chat threads, messages, audit timeline events, notification delivery tracking
4. `20260312135000_moderation_and_public_views.sql`
   - moderation cases/actions and public stats views

## SQL editor rerun note
- These four files are currently reset-friendly for manual SQL editor import.
- Each file drops and recreates the objects it owns before rebuilding them.
- Use them only while the project is still in early setup or disposable-data mode.
- Do not rerun them on a live environment with production data.
