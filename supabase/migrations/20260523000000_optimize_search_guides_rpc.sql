-- OPT-001: Optimize search_guides RPC — push specializations, region, and has_listings filters server-side.
-- Replaces client-side array filtering with PostgreSQL-level WHERE clauses.
-- Backward-compatible: all new params default to NULL (no filter applied).

create or replace function public.search_guides(
  q text default '',
  p_specializations text[] default null,
  p_region text default null,
  p_has_listings boolean default null
)
returns setof public.guide_search_result_row
language plpgsql
stable
security definer
set search_path = public
as 
declare
  tokens text[] := array[]::text[];
  raw_part text;
  cleaned text;
begin
  if trim(coalesce(q, '')) = '' then
    return query
    select
      g.*,
      false::boolean as is_partial_match
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
    if cleaned = '' then
      continue;
    end if;
    if cleaned !~ '^[a-zA-Zа-яА-ЯёЁ0-9 -]+$' then
      continue;
    end if;
    tokens := array_append(tokens, cleaned);
  end loop;

  if coalesce(array_length(tokens, 1), 0) = 0 then
    return query
    select
      g.*,
      false::boolean as is_partial_match
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
    select g.*
    from public.guide_profiles g
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
    select v.*
    from visible v
    where not exists (
      select 1
      from unnest(tokens) as tok(token)
      where not (
        v.display_name ilike '%' || tok.token || '%'
        or v.bio ilike '%' || tok.token || '%'
        or v.base_city ilike '%' || tok.token || '%'
        or exists (
          select 1
          from unnest(v.languages) as lang(value)
          where lower(lang.value) ilike '%' || tok.token || '%'
        )
        or exists (
          select 1
          from unnest(v.specializations) as spec(value)
          where lower(spec.value) ilike '%' || tok.token || '%'
        )
      )
    )
  ),
  strict_count as (
    select count(*)::bigint as c from strict
  ),
  or_fallback as (
    select v.*
    from visible v
    where exists (
      select 1
      from unnest(tokens) as tok(token)
      where (
        v.display_name ilike '%' || tok.token || '%'
        or v.bio ilike '%' || tok.token || '%'
        or v.base_city ilike '%' || tok.token || '%'
        or exists (
          select 1
          from unnest(v.languages) as lang(value)
          where lower(lang.value) ilike '%' || tok.token || '%'
        )
        or exists (
          select 1
          from unnest(v.specializations) as spec(value)
          where lower(spec.value) ilike '%' || tok.token || '%'
        )
      )
    )
  ),
  result as (
    select s.*, false::boolean as is_partial_match
    from strict s
    where (select c from strict_count) > 0
    union all
    select o.*, true::boolean as is_partial_match
    from or_fallback o
    where (select c from strict_count) = 0
  )
  select r.*
  from result r
  order by r.created_at desc;
end;
;

revoke all on function public.search_guides(text, text[], text, boolean) from public;
grant execute on function public.search_guides(text, text[], text, boolean) to anon, authenticated, service_role;
