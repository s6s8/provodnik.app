-- №27: public guide detail shows only the region; the guide's base city
-- (guide_profiles.base_city) never reaches the page because the detail RPC
-- doesn't return it. Add base_city to get_public_guide_by_slug.
--
-- Changing RETURNS TABLE requires dropping the function first (CREATE OR
-- REPLACE cannot alter the out-parameter list).

DROP FUNCTION IF EXISTS "public"."get_public_guide_by_slug"("text"[]);

CREATE FUNCTION "public"."get_public_guide_by_slug"("p_slugs" "text"[])
RETURNS TABLE (
  "user_id" "uuid",
  "slug" "text",
  "full_name" "text",
  "avatar_url" "text",
  "bio" "text",
  "base_city" "text",
  "regions" "text"[],
  "languages" "text"[],
  "specialties" "text"[],
  "specializations" "text"[],
  "years_experience" integer,
  "verification_status" "text",
  "is_available" boolean
)
LANGUAGE "sql"
STABLE
SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
  SELECT
    g.user_id,
    g.slug,
    p.full_name,
    p.avatar_url,
    g.bio,
    g.base_city,
    g.regions,
    g.languages,
    g.specialties,
    g.specializations,
    g.years_experience,
    g.verification_status::text,
    g.is_available
  FROM public.guide_profiles g
  JOIN public.profiles p ON p.id = g.user_id
  WHERE g.slug = ANY(p_slugs)
    AND g.verification_status = 'approved'
    AND g.is_available = true
    AND p.role = 'guide'
    AND p.account_status = 'active'
  ORDER BY g.updated_at DESC
  LIMIT 1;
$$;

ALTER FUNCTION "public"."get_public_guide_by_slug"("text"[]) OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."get_public_guide_by_slug"("text"[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."get_public_guide_by_slug"("text"[]) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."get_public_guide_by_slug"("text"[]) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_public_guide_by_slug"("text"[]) TO "service_role";

COMMENT ON FUNCTION "public"."get_public_guide_by_slug"("text"[]) IS
  'Public guide detail lookup by slug candidate list. SECURITY DEFINER so anonymous callers can read the linked profile display fields; enforces the same active-guide allowlist as search_guides.';
