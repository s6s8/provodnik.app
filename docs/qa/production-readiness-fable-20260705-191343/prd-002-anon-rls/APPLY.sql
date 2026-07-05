-- PRD-002 — apply the public-catalog anon-access policy to the LIVE DB.
--
-- HOW TO RUN: paste this whole block into the Supabase SQL editor (production
-- project) and execute. Do NOT run `supabase db push` — the migration ledger is
-- out of sync with the live schema (PRD-004); a blind push can drop columns that
-- live features still depend on. This block is the exact body of migration
-- supabase/migrations/20260609000001_public_catalog_anon_access.sql and is
-- idempotent (drop-if-exists → create).
--
-- SAFETY: this only widens SELECT visibility for rows that are already
-- status='open'. It grants no INSERT/UPDATE/DELETE and exposes no non-open rows.

begin;

drop policy if exists "traveler_requests_select" on public.traveler_requests;

create policy "traveler_requests_select"
  on public.traveler_requests
  for select
  using (
    -- anonymous: open requests are publicly visible
    status = 'open'::public.request_status
    -- owner always sees their own
    or (select auth.uid()::uuid) = traveler_id
    -- admin sees all
    or public.is_admin()
    -- authenticated users can see open+joinable requests
    or (
      (select auth.uid()::uuid) is not null
      and status = 'open'::public.request_status
      and open_to_join = true
    )
  );

commit;

-- After COMMIT, run VERIFY.sql (introspection) and the anon REST probe in
-- README.md to confirm anonymous visibility, then reconcile the migration ledger
-- with `supabase migration repair` (see README.md — do NOT raw-INSERT into
-- supabase_migrations).
