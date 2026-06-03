drop function if exists public.count_competing_offers(uuid);

create function public.count_competing_offers(p_request_id uuid)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $func$
declare
  v_user uuid := auth.uid();
  v_count integer;
begin
  if not public.user_has_role(v_user, 'guide'::public.app_role) then
    raise exception 'guide_required';
  end if;

  select count(*)::integer
    into v_count
  from public.guide_offers
  where request_id = p_request_id
    and status = 'pending'::public.offer_status;

  return coalesce(v_count, 0);
end;
$func$;

revoke all on function public.count_competing_offers(uuid) from public;
revoke execute on function public.count_competing_offers(uuid) from anon;
grant execute on function public.count_competing_offers(uuid) to authenticated;

drop function if exists public.record_request_view(uuid);

create function public.record_request_view(p_request_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $func$
declare
  v_user uuid := auth.uid();
  v_count integer;
begin
  if not public.user_has_role(v_user, 'guide'::public.app_role) then
    raise exception 'guide_required';
  end if;

  insert into public.request_views (request_id, guide_id, viewed_at)
  values (p_request_id, v_user, now())
  on conflict (request_id, guide_id) do update
    set viewed_at = excluded.viewed_at
    where request_views.viewed_at < excluded.viewed_at - interval '5 minutes';

  select count(distinct guide_id)::integer
    into v_count
  from public.request_views
  where request_id = p_request_id;

  return coalesce(v_count, 0);
end;
$func$;

revoke all on function public.record_request_view(uuid) from public;
revoke execute on function public.record_request_view(uuid) from anon;
grant execute on function public.record_request_view(uuid) to authenticated;

drop policy if exists glp_public_select on public.guide_location_photos;

create policy glp_public_select on public.guide_location_photos
  for select to anon, authenticated
  using (
    exists (
      select 1
      from public.guide_profiles gp
      where gp.user_id = guide_location_photos.guide_id
        and gp.verification_status = 'approved'::public.guide_verification_status
    )
  );
