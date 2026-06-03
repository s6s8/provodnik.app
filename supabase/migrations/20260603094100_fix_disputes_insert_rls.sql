drop policy if exists "disputes_insert" on public.disputes;
drop policy if exists "disputes_insert_related_booking_user" on public.disputes;

create policy "disputes_insert"
  on public.disputes
  for insert
  with check (
    (
      (select auth.uid()::uuid) = opened_by
      and exists (
        select 1
        from public.bookings b
        where b.id = booking_id
          and (
            b.traveler_id = (select auth.uid()::uuid)
            or b.guide_id = (select auth.uid()::uuid)
          )
      )
    )
    or public.is_admin()
  );
