-- =============================================================================
-- Refreeze search_guides rowtype after guide_profiles schema changes.
--
-- public.search_guides returns SETOF public.guide_search_result_row, and that
-- carrier view freezes the guide_profiles column list at creation time. Adding
-- guide_profiles.guide_type after the previous refreeze made the function return
-- a different row shape on live (42804: text vs boolean near is_partial_match).
--
-- Keep this migration intentionally narrow: no data changes, no RLS changes.
-- =============================================================================

begin;

drop function if exists public.search_guides(text, text[], text, boolean);
drop view if exists public.guide_search_result_row;

create view public.guide_search_result_row as
  select gp.*, false::boolean as is_partial_match
  from public.guide_profiles gp
  where false;

grant select on public.guide_search_result_row to anon, authenticated, service_role;

create or replace function public.search_guides(
  q text default ''::text,
  p_specializations text[] default null::text[],
  p_region text default null::text,
  p_has_listings boolean default null::boolean
)
returns setof public.guide_search_result_row
language plpgsql
stable security definer
set search_path to 'public'
as $function$
declare
  tokens text[] := array[]::text[];
  raw_part text;
  cleaned text;
begin
  if trim(coalesce(q, '')) = '' then
    return query
    select g.*, false::boolean as is_partial_match
    from public.guide_profiles g
    where g.verification_status = 'approved'
      and g.is_available = true
      and (p_specializations is null or g.specializations && p_specializations)
      and (p_region is null or g.regions @> array[p_region])
      and (p_has_listings is null or p_has_listings = false or exists (
        select 1 from public.listings l
        where l.guide_id = g.user_id and l.status = 'published'
      ))
    order by g.created_at desc;
    return;
  end if;

  foreach raw_part in array string_to_array(q, ',')
  loop
    cleaned := lower(trim(raw_part));
    if cleaned = '' then continue; end if;
    if cleaned !~ '^[a-zA-Zа-яА-ЯёЁ0-9 -]+$' then continue; end if;
    tokens := array_append(tokens, cleaned);
  end loop;

  if coalesce(array_length(tokens, 1), 0) = 0 then
    return query
    select g.*, false::boolean as is_partial_match
    from public.guide_profiles g
    where g.verification_status = 'approved'
      and g.is_available = true
      and (p_specializations is null or g.specializations && p_specializations)
      and (p_region is null or g.regions @> array[p_region])
      and (p_has_listings is null or p_has_listings = false or exists (
        select 1 from public.listings l
        where l.guide_id = g.user_id and l.status = 'published'
      ))
    order by g.created_at desc;
    return;
  end if;

  return query
  with visible as (
    select g, p.full_name
    from public.guide_profiles g
    left join public.profiles p on p.id = g.user_id
    where g.verification_status = 'approved'
      and g.is_available = true
      and (p_specializations is null or g.specializations && p_specializations)
      and (p_region is null or g.regions @> array[p_region])
      and (p_has_listings is null or p_has_listings = false or exists (
        select 1 from public.listings l
        where l.guide_id = g.user_id and l.status = 'published'
      ))
  ),
  strict as (
    select v.g
    from visible v
    where not exists (
      select 1
      from unnest(tokens) as tok(token)
      where not (
        v.full_name ilike '%' || tok.token || '%'
        or (v.g).bio ilike '%' || tok.token || '%'
        or (v.g).base_city ilike '%' || tok.token || '%'
        or exists (select 1 from unnest((v.g).languages) as lang(value) where lower(lang.value) ilike '%' || tok.token || '%')
        or exists (select 1 from unnest((v.g).specializations) as spec(value) where lower(spec.value) ilike '%' || tok.token || '%')
      )
    )
  ),
  strict_count as (select count(*)::bigint as c from strict),
  or_fallback as (
    select v.g
    from visible v
    where exists (
      select 1
      from unnest(tokens) as tok(token)
      where (
        v.full_name ilike '%' || tok.token || '%'
        or (v.g).bio ilike '%' || tok.token || '%'
        or (v.g).base_city ilike '%' || tok.token || '%'
        or exists (select 1 from unnest((v.g).languages) as lang(value) where lower(lang.value) ilike '%' || tok.token || '%')
        or exists (select 1 from unnest((v.g).specializations) as spec(value) where lower(spec.value) ilike '%' || tok.token || '%')
      )
    )
  ),
  result as (
    select (s.g).*, false::boolean as is_partial_match
    from strict s
    where (select c from strict_count) > 0
    union all
    select (o.g).*, true::boolean as is_partial_match
    from or_fallback o
    where (select c from strict_count) = 0
  )
  select r.* from result r order by r.created_at desc;
end;
$function$;

grant execute on function public.search_guides(text, text[], text, boolean)
  to anon, authenticated, service_role;

commit;
