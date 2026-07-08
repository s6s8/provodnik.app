-- Task 48 — guide calendar availability blocks (layer B).
--
-- Guide-wide unavailability windows: close a whole day, a date range, or a time
-- window. This is a SECOND layer on top of the is_available master switch (layer A)
-- and platform account_status (layer C) — it never replaces them.
--
-- Kept in its own table keyed to the guide (guide_profiles.user_id), NOT as a
-- column on guide_profiles: adding a column there breaks the frozen search_guides
-- rowtype (error 42804). Same precedent as guide_availability_events.

create table public.guide_availability_blocks (
  id         uuid primary key default extensions.gen_random_uuid(),
  guide_id   uuid not null references public.guide_profiles(user_id) on delete cascade,
  start_at   timestamptz not null,
  end_at     timestamptz not null,
  all_day    boolean not null default false,
  reason     text,                              -- private to the guide; never shown to a tourist
  source     text not null default 'manual' check (source in ('manual','calendar','system')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,                        -- soft delete keeps the audit trail
  constraint guide_availability_blocks_interval_check check (end_at > start_at)
);

alter table public.guide_availability_blocks enable row level security;

-- Owner (guide) manages only their own blocks; admin/support sees all. Tourists
-- never read this table directly — availability is exposed only as a boolean via
-- guide_interval_blocked(), so the private reason stays private.
create policy "guide_availability_blocks_select" on public.guide_availability_blocks
  for select using ((select auth.uid()) = guide_id or public.is_admin());

create policy "guide_availability_blocks_insert" on public.guide_availability_blocks
  for insert with check (
    ((select auth.uid()) = guide_id and (select auth.uid()) = created_by) or public.is_admin()
  );

create policy "guide_availability_blocks_update" on public.guide_availability_blocks
  for update using ((select auth.uid()) = guide_id or public.is_admin())
  with check ((select auth.uid()) = guide_id or public.is_admin());

create policy "guide_availability_blocks_delete" on public.guide_availability_blocks
  for delete using ((select auth.uid()) = guide_id or public.is_admin());

create or replace trigger set_guide_availability_blocks_updated_at
  before update on public.guide_availability_blocks
  for each row execute function public.set_updated_at();

create index guide_availability_blocks_active_idx
  on public.guide_availability_blocks (guide_id, start_at, end_at)
  where deleted_at is null;

-- Single source of truth for layer B: does an ACTIVE block intersect [p_start, p_end)?
-- Half-open overlap via plain comparisons (never throws on degenerate bounds).
-- SECURITY DEFINER so it can run inside the guide_offers_insert RLS WITH CHECK
-- regardless of the caller's own read grants; it returns only a boolean, so no
-- block details leak. Null bounds (a date-less offer) → not blocked.
create or replace function public.guide_interval_blocked(
  p_guide_id uuid,
  p_start timestamptz,
  p_end timestamptz
) returns boolean
  language sql
  stable
  security definer
  set search_path to 'public'
as $$
  select case
    when p_start is null or p_end is null then false
    else exists (
      select 1
      from public.guide_availability_blocks b
      where b.guide_id = p_guide_id
        and b.deleted_at is null
        and b.start_at < p_end
        and p_start < b.end_at
    )
  end;
$$;

revoke all on function public.guide_interval_blocked(uuid, timestamptz, timestamptz) from public;
grant execute on function public.guide_interval_blocked(uuid, timestamptz, timestamptz) to authenticated, service_role;

-- Extend the offer-insert gate with layer B. A guide cannot submit an offer whose
-- [starts_at, ends_at) intersects one of their own active calendar blocks. Preserves
-- the approved + is_available + active-account conjuncts from
-- 20260708120001_guide_offers_insert_requires_available.sql. This closes the
-- direct-API bypass; submitOfferAction mirrors it for a friendly message.
DROP POLICY IF EXISTS "guide_offers_insert" ON public.guide_offers;

CREATE POLICY "guide_offers_insert" ON public.guide_offers
  FOR INSERT
  WITH CHECK (
    (
      (SELECT auth.uid()) = guide_id
      AND public.profile_account_status_for(guide_id) = 'active'::public.account_status
      AND EXISTS (
        SELECT 1
        FROM public.guide_profiles gp
        WHERE gp.user_id = guide_offers.guide_id
          AND gp.verification_status = 'approved'::public.guide_verification_status
          AND gp.is_available = true
      )
      AND NOT public.guide_interval_blocked(
        guide_offers.guide_id,
        guide_offers.starts_at,
        guide_offers.ends_at
      )
    )
    OR public.is_admin()
  );
