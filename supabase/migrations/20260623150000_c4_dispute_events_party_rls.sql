-- C4 Two-way dispute conversation — widen dispute_events RLS from opener-only to BOTH booking parties (+admin).
-- The conversation is modeled as dispute_events (event_type='comment'); the existing opener-only RLS
-- wrongly excluded the other booking party. New policy = the two booking parties (via disputes→bookings) + admin.
-- SECURITY: still strictly party-scoped (traveler_id/guide_id of the parent booking) + admin; anon blocked.

drop policy if exists "dispute_events_select" on public.dispute_events;
create policy "dispute_events_select" on public.dispute_events for select
  using (
    exists (
      select 1
      from public.disputes d
      join public.bookings b on b.id = d.booking_id
      where d.id = dispute_id
        and ( b.traveler_id = (select auth.uid()::uuid) or b.guide_id = (select auth.uid()::uuid) )
    )
    or public.is_admin()
  );

-- INSERT: widen to both booking parties + admin (parity with original opener/admin structure, no new actor constraint
-- to avoid breaking existing server-side/RPC event inserts). App layer sets actor_id from the session.
drop policy if exists "dispute_events_insert" on public.dispute_events;
create policy "dispute_events_insert" on public.dispute_events for insert
  with check (
    exists (
      select 1
      from public.disputes d
      join public.bookings b on b.id = d.booking_id
      where d.id = dispute_id
        and ( b.traveler_id = (select auth.uid()::uuid) or b.guide_id = (select auth.uid()::uuid) )
    )
    or public.is_admin()
  );
