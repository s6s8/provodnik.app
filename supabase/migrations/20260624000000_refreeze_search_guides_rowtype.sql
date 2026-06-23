-- =============================================================================
-- FIX: search_guides RPC errors 42804 ("Returned type text does not match
-- expected type boolean in column 33").
-- Root cause: public.guide_search_result_row is a VIEW (a rowtype carrier,
-- "SELECT <explicit cols>, false AS is_partial_match FROM guide_profiles WHERE false")
-- frozen to an OLDER guide_profiles shape; a later migration added `display_name`,
-- so the function's `select g.*, is_partial_match` returns one more column than the
-- view's rowtype expects -> mismatch at column 33.
-- Fix: drop the dependent function, drop+recreate the view to mirror the CURRENT
-- guide_profiles columns (via gp.*), recreate the function body verbatim, re-grant.
-- NOTE: a view still freezes gp.* at creation time; if guide_profiles columns change
-- again, re-run this migration. (Pre-existing design; out of scope to refactor here.)
-- =============================================================================

-- function returns SETOF the view's rowtype -> drop it first, then the stale view.
drop function if exists public.search_guides(text, text[], text, boolean);
drop view if exists public.guide_search_result_row;

create view public.guide_search_result_row as
  select gp.*, false::boolean as is_partial_match
  from public.guide_profiles gp
  where false;

grant select on public.guide_search_result_row to anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.search_guides(q text DEFAULT ''::text, p_specializations text[] DEFAULT NULL::text[], p_region text DEFAULT NULL::text, p_has_listings boolean DEFAULT NULL::boolean)
 RETURNS SETOF guide_search_result_row
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

-- DROP cleared grants; restore EXECUTE to the same roles as before.
grant execute on function public.search_guides(text, text[], text, boolean) to anon, authenticated, service_role;
