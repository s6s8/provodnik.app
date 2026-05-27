-- OPT-001: Optimize search_guides RPC — push specializations, region, and has_listings filters server-side.
-- Replaces client-side array filtering with PostgreSQL-level WHERE clauses.
-- Backward-compatible at the call site: all new params default to NULL (no filter applied).
--
-- 2026-05-27 self-heal: restored $function$ dollar-quote markers (previous revision
-- of this file lacked them and so the migration could never apply). The 4-arg
-- function was re-applied to prod via admin REST to recover from the empty /guides catalog.

DROP FUNCTION IF EXISTS public.search_guides(text);

CREATE OR REPLACE FUNCTION public.search_guides(
  q text DEFAULT '',
  p_specializations text[] DEFAULT NULL,
  p_region text DEFAULT NULL,
  p_has_listings boolean DEFAULT NULL
)
RETURNS SETOF public.guide_search_result_row
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  tokens text[] := ARRAY[]::text[];
  raw_part text;
  cleaned text;
BEGIN
  IF trim(coalesce(q, '')) = '' THEN
    RETURN QUERY
    SELECT g.*, false::boolean AS is_partial_match
    FROM public.guide_profiles g
    WHERE g.verification_status = 'approved'
      AND g.is_available = true
      AND (p_specializations IS NULL OR g.specializations && p_specializations)
      AND (p_region IS NULL OR g.regions @> ARRAY[p_region])
      AND (p_has_listings IS NULL OR p_has_listings = false OR EXISTS (
        SELECT 1 FROM public.listings l
        WHERE l.guide_id = g.user_id AND l.status = 'published'
      ))
    ORDER BY g.created_at DESC;
    RETURN;
  END IF;

  FOREACH raw_part IN ARRAY string_to_array(q, ',')
  LOOP
    cleaned := lower(trim(raw_part));
    IF cleaned = '' THEN CONTINUE; END IF;
    IF cleaned !~ '^[a-zA-Zа-яА-ЯёЁ0-9 -]+$' THEN CONTINUE; END IF;
    tokens := array_append(tokens, cleaned);
  END LOOP;

  IF coalesce(array_length(tokens, 1), 0) = 0 THEN
    RETURN QUERY
    SELECT g.*, false::boolean AS is_partial_match
    FROM public.guide_profiles g
    WHERE g.verification_status = 'approved'
      AND g.is_available = true
      AND (p_specializations IS NULL OR g.specializations && p_specializations)
      AND (p_region IS NULL OR g.regions @> ARRAY[p_region])
      AND (p_has_listings IS NULL OR p_has_listings = false OR EXISTS (
        SELECT 1 FROM public.listings l
        WHERE l.guide_id = g.user_id AND l.status = 'published'
      ))
    ORDER BY g.created_at DESC;
    RETURN;
  END IF;

  RETURN QUERY
  WITH visible AS (
    SELECT g.*
    FROM public.guide_profiles g
    WHERE g.verification_status = 'approved'
      AND g.is_available = true
      AND (p_specializations IS NULL OR g.specializations && p_specializations)
      AND (p_region IS NULL OR g.regions @> ARRAY[p_region])
      AND (p_has_listings IS NULL OR p_has_listings = false OR EXISTS (
        SELECT 1 FROM public.listings l
        WHERE l.guide_id = g.user_id AND l.status = 'published'
      ))
  ),
  strict AS (
    SELECT v.*
    FROM visible v
    WHERE NOT EXISTS (
      SELECT 1 FROM unnest(tokens) AS tok(token)
      WHERE NOT (
        v.display_name ILIKE '%' || tok.token || '%'
        OR v.bio ILIKE '%' || tok.token || '%'
        OR v.base_city ILIKE '%' || tok.token || '%'
        OR EXISTS (SELECT 1 FROM unnest(v.languages) AS lang(value) WHERE lower(lang.value) ILIKE '%' || tok.token || '%')
        OR EXISTS (SELECT 1 FROM unnest(v.specializations) AS spec(value) WHERE lower(spec.value) ILIKE '%' || tok.token || '%')
      )
    )
  ),
  strict_count AS (SELECT count(*)::bigint AS c FROM strict),
  or_fallback AS (
    SELECT v.*
    FROM visible v
    WHERE EXISTS (
      SELECT 1 FROM unnest(tokens) AS tok(token)
      WHERE (
        v.display_name ILIKE '%' || tok.token || '%'
        OR v.bio ILIKE '%' || tok.token || '%'
        OR v.base_city ILIKE '%' || tok.token || '%'
        OR EXISTS (SELECT 1 FROM unnest(v.languages) AS lang(value) WHERE lower(lang.value) ILIKE '%' || tok.token || '%')
        OR EXISTS (SELECT 1 FROM unnest(v.specializations) AS spec(value) WHERE lower(spec.value) ILIKE '%' || tok.token || '%')
      )
    )
  ),
  result AS (
    SELECT s.*, false::boolean AS is_partial_match
    FROM strict s
    WHERE (SELECT c FROM strict_count) > 0
    UNION ALL
    SELECT o.*, true::boolean AS is_partial_match
    FROM or_fallback o
    WHERE (SELECT c FROM strict_count) = 0
  )
  SELECT r.* FROM result r ORDER BY r.created_at DESC;
END;
$function$;

REVOKE ALL ON FUNCTION public.search_guides(text, text[], text, boolean) FROM public;
GRANT EXECUTE ON FUNCTION public.search_guides(text, text[], text, boolean) TO anon, authenticated, service_role;
