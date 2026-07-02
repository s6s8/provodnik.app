-- Public guide discovery must respect admin user-page role/status changes.
-- A guide profile can remain approved/available historically, but it is public
-- only while the linked account is still an active guide.

CREATE OR REPLACE FUNCTION "public"."search_guides"("q" "text" DEFAULT ''::"text", "p_specializations" "text"[] DEFAULT NULL::"text"[], "p_region" "text" DEFAULT NULL::"text", "p_has_listings" boolean DEFAULT NULL::boolean) RETURNS SETOF "public"."guide_search_result_row"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
declare
  tokens text[] := array[]::text[];
  raw_part text;
  cleaned text;
begin
  if trim(coalesce(q, '')) = '' then
    return query
    select g.*, false::boolean as is_partial_match
    from public.guide_profiles g
    join public.profiles p on p.id = g.user_id
    where g.verification_status = 'approved'
      and p.role = 'guide'
      and p.account_status = 'active'
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
    join public.profiles p on p.id = g.user_id
    where g.verification_status = 'approved'
      and p.role = 'guide'
      and p.account_status = 'active'
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
    join public.profiles p on p.id = g.user_id
    where g.verification_status = 'approved'
      and p.role = 'guide'
      and p.account_status = 'active'
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
$_$;


