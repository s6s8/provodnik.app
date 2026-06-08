-- Allow anonymous users to see open requests in the public catalog
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
