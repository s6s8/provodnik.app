-- PRD-033 — tighten overbroad public SELECT (`using true`) on two tables.
--
-- listing_inclusions was world-readable, exposing inclusion text of DRAFT
-- listings. Gate it on parent-listing visibility, mirroring listings_select
-- (published OR owner OR admin) so inclusions never outlive their parent's
-- visibility. referral_program_config was world-readable config with no app
-- reader and zero rows; restrict to admin.
--
-- SELECT-only changes; no writes affected. Applied to live DB via targeted SQL
-- (not `db push`; ledger is out of sync — see MIGRATION_INVENTORY).

begin;

drop policy if exists "listing_inclusions_select_all" on public.listing_inclusions;

create policy "listing_inclusions_select_all"
  on public.listing_inclusions
  for select
  using (
    exists (
      select 1
      from public.listings l
      where l.id = listing_inclusions.listing_id
        and (
          l.status = 'published'::public.listing_status
          or (select auth.uid()) = l.guide_id
          or public.is_admin()
        )
    )
  );

drop policy if exists "referral_config_select_all" on public.referral_program_config;

create policy "referral_config_select_all"
  on public.referral_program_config
  for select
  using (public.is_admin());

commit;
