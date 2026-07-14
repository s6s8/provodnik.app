-- The public guide surfaces served the guide's PRIVATE full FIO, not their public name.
--
-- Item 13 / the two-field standard (migration 20260714000000, in as many words):
--   guide_profiles.display_name = the public name a traveler sees  («Гиляна»)
--   profiles.full_name          = the private, admin-only FIO      («Гиляна Манджиева»)
--
-- Both anon-facing readers below emit `p.full_name`, and both are SECURITY DEFINER
-- (the view is `security_invoker = false`; the function is DEFINER), so they hand the
-- private FIO to anonymous callers whom RLS would otherwise never let near `profiles`.
-- Everything downstream then renders it:
--   /guides/[slug]                    — RPC → the page <h1>
--   /requests/[id]                    — view → guide cards on the offers
--   /messages/[threadId], conversations — view → the guide's name in the traveler's chat
--   /listings/[id]/book               — view → the guide's name on the booking screen
-- The /guides grid only looked correct by accident: anon RLS hides `profiles`, so
-- `full_name` came back NULL there and the app fell back to display_name. An admin
-- browsing the same grid saw the FIOs.
--
-- Fixed once, at the boundary every one of those callers routes through, instead of in
-- five app-layer readers: the two public projections now resolve the name themselves.
-- `full_name` keeps its column name (no caller changes, no type regeneration) but now
-- carries the PUBLIC name. `profiles.full_name` survives only as the legacy fallback
-- for guides who never set a display_name — the same fallback the app already applied.
--
-- Net effect: a guide's legal FIO can no longer leave the database on a public read.
--
-- ROLLBACK: restore `p.full_name` in place of the COALESCE in both bodies
--           (i.e. re-open the leak).

CREATE OR REPLACE VIEW "public"."v_guide_public_profile" AS
  SELECT
    "gp"."user_id",
    "gp"."slug",
    -- PUBLIC name. Never the raw p.full_name while a display_name exists.
    COALESCE(NULLIF(BTRIM("gp"."display_name"), ''), "p"."full_name") AS "full_name",
    "gp"."bio",
    "gp"."regions",
    "gp"."languages",
    "gp"."specialties",
    "gp"."average_rating",
    "gp"."review_count",
    "gp"."response_rate",
    "gp"."contact_visibility_unlocked",
    "gp"."is_available",
    "gp"."locale",
    "gp"."preferred_currency",
    "p"."avatar_url",
    "gp"."years_experience",
    ( SELECT count(*) AS count
        FROM "public"."bookings" "b"
       WHERE "b"."guide_id" = "gp"."user_id"
         AND "b"."status" = 'completed'::"public"."booking_status") AS "trips_completed",
    ( SELECT round(100.0 * count(*) FILTER (WHERE "r"."rating" >= 4)::numeric
                   / NULLIF(count(*), 0)::numeric)
        FROM "public"."reviews" "r"
       WHERE "r"."guide_id" = "gp"."user_id"
         AND "r"."status" = 'published'::"public"."review_status") AS "recommend_pct"
  FROM "public"."guide_profiles" "gp"
    LEFT JOIN "public"."profiles" "p" ON "p"."id" = "gp"."user_id"
  WHERE "gp"."verification_status" = 'approved'::"public"."guide_verification_status";

COMMENT ON VIEW "public"."v_guide_public_profile" IS
  'Anonymous-safe guide projection. `full_name` carries the PUBLIC name (guide_profiles.display_name, falling back to profiles.full_name only for legacy rows) — never the private FIO while a display name exists.';

CREATE OR REPLACE FUNCTION "public"."get_public_guide_by_slug"("p_slugs" "text"[])
RETURNS TABLE(
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
LANGUAGE "sql" STABLE SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
  SELECT
    g.user_id,
    g.slug,
    -- PUBLIC name (see the view above). This is what the /guides/[slug] <h1> renders.
    COALESCE(NULLIF(BTRIM(g.display_name), ''), p.full_name) AS full_name,
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

ALTER FUNCTION "public"."get_public_guide_by_slug"("p_slugs" "text"[]) OWNER TO "postgres";
