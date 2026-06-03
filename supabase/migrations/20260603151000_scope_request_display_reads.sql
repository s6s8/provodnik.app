drop policy if exists "guides_read_requester_profiles" on public.profiles;

drop policy if exists "traveler_requests_select" on public.traveler_requests;
drop policy if exists "traveler_requests_select_owner_joinable_guide_or_admin" on public.traveler_requests;

create policy "traveler_requests_select"
  on public.traveler_requests
  for select
  using (
    (select auth.uid()::uuid) = traveler_id
    or public.is_admin()
    or (status = 'open'::public.request_status and public.is_guide())
    or (
      (select auth.uid()::uuid) is not null
      and status = 'open'::public.request_status
      and open_to_join = true
    )
  );

drop function if exists public.get_interacted_requester_display_profiles();

create function public.get_interacted_requester_display_profiles()
returns table (
  request_id uuid,
  requester_id uuid,
  full_name text,
  avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select distinct
    tr.id as request_id,
    p.id as requester_id,
    p.full_name,
    p.avatar_url
  from public.traveler_requests tr
  join public.profiles p on p.id = tr.traveler_id
  where (select auth.uid()::uuid) is not null
    and public.user_has_role((select auth.uid()::uuid), 'guide'::public.app_role)
    and (
      exists (
        select 1
        from public.guide_offers go
        where go.request_id = tr.id
          and go.guide_id = (select auth.uid()::uuid)
      )
      or exists (
        select 1
        from public.request_views rv
        where rv.request_id = tr.id
          and rv.guide_id = (select auth.uid()::uuid)
      )
      or exists (
        select 1
        from public.bookings b
        where b.request_id = tr.id
          and b.guide_id = (select auth.uid()::uuid)
      )
    );
$$;

drop function if exists public.get_traveler_booking_guide_display_profiles();

create function public.get_traveler_booking_guide_display_profiles()
returns table (
  booking_id uuid,
  guide_id uuid,
  full_name text,
  avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    b.id as booking_id,
    p.id as guide_id,
    p.full_name,
    p.avatar_url
  from public.bookings b
  join public.profiles p on p.id = b.guide_id
  where b.traveler_id = (select auth.uid()::uuid)
    and b.status in (
      'awaiting_guide_confirmation'::public.booking_status,
      'confirmed'::public.booking_status
    );
$$;

drop function if exists public.get_joined_request_owner_display_profiles();

create function public.get_joined_request_owner_display_profiles()
returns table (
  request_id uuid,
  owner_id uuid,
  full_name text,
  avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select distinct
    tr.id as request_id,
    p.id as owner_id,
    p.full_name,
    p.avatar_url
  from public.open_request_members orm
  join public.traveler_requests tr on tr.id = orm.request_id
  join public.profiles p on p.id = tr.traveler_id
  where orm.traveler_id = (select auth.uid()::uuid)
    and orm.status = 'joined'::public.member_status
    and orm.left_at is null
    and tr.traveler_id <> (select auth.uid()::uuid);
$$;

revoke execute on function public.get_interacted_requester_display_profiles() from public, anon;
revoke execute on function public.get_traveler_booking_guide_display_profiles() from public, anon;
revoke execute on function public.get_joined_request_owner_display_profiles() from public, anon;

grant execute on function public.get_interacted_requester_display_profiles() to authenticated;
grant execute on function public.get_traveler_booking_guide_display_profiles() to authenticated;
grant execute on function public.get_joined_request_owner_display_profiles() to authenticated;
