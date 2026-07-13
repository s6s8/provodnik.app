-- Item 14: unify the two "approved" listing statuses.
--
-- The moderation queue (approveListing) wrote `active`, while every public reader
-- gates on `published`: getActiveListings, the sitemap, and all listing_* RLS
-- policies. A queue-approved excursion was therefore approved AND publicly
-- invisible, with nothing in the admin UI saying so.
--
-- Code now writes `published` everywhere (PUBLIC_LISTING_STATUS). This migrates the
-- rows that the old writer left behind.
--
-- The `active` enum value is intentionally NOT dropped: removing a value from a
-- Postgres enum requires recreating the type and rewriting every dependent column.
-- Nothing writes it any more; the type marks it @deprecated.
--
-- PROD: do NOT `supabase db push` (the prod migration ledger is truncated —
-- landmine). Apply as targeted SQL + a manual ledger entry. The pre-image backup
-- and the rollback are in docs/audits/wildberries-2026-07/prod-data-repair-runbook.md §5.

begin;

-- Pre-image, so the rollback can restore exactly the rows this touched.
create table if not exists public.repair_20260713_listing_status_preimage as
select id, status, now() as captured_at
from public.listings
where status = 'active';

update public.listings
set status = 'published'
where status = 'active';

commit;

-- Post-check (must return 0):
--   select count(*) from public.listings where status = 'active';
--
-- Rollback:
--   update public.listings l
--   set status = b.status
--   from public.repair_20260713_listing_status_preimage b
--   where b.id = l.id;
