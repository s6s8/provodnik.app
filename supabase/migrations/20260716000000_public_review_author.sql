-- Public review cards showed EVERY author as «Путешественник».
--
-- Root cause: the three public review readers (homepage block, guide page, listing
-- page) all did `reviews.select("*, profiles:traveler_id(full_name)")`. `profiles_select`
-- RLS is `auth.uid() = id OR is_admin()`, so for an anonymous visitor — the exact
-- audience these blocks exist for — the embedded join silently resolves to NULL and
-- every card falls back to the generic label. Nobody sees an error; the trust surface
-- just quietly loses its authors.
--
-- Fix at the boundary, not in three app-layer callers: an anon-safe projection, the
-- same shape the codebase already uses for public traveler requests
-- (`v_public_open_requests`, 20260703000100). The view is `security_invoker = false`,
-- so it reads `profiles` as its owner and RLS on the base tables stays untouched.
--
-- Privacy: the author's legal `full_name` is NEVER exposed. The view emits first name
-- + last initial ("Ирина Петрова" → "Ирина П."), which is what a review card shows.
-- `traveler_id` is not exposed at all, matching v_public_open_requests.
--
-- ROLLBACK: DROP VIEW IF EXISTS public.v_public_reviews;
--           (readers fall back to the profiles join, i.e. the «Путешественник» bug)

CREATE OR REPLACE VIEW "public"."v_public_reviews"
WITH ("security_invoker" = false) AS
  SELECT
    "r"."id",
    "r"."guide_id",
    "r"."listing_id",
    "r"."rating",
    "r"."title",
    "r"."body",
    "r"."created_at",
    -- "Ирина Петрова" -> "Ирина П."; "Ирина" -> "Ирина"; "" / NULL -> NULL (the app
    -- keeps its «Путешественник» fallback for authors with no name on file).
    NULLIF(
      TRIM(
        SPLIT_PART(COALESCE("p"."full_name", ''), ' ', 1) ||
        CASE
          WHEN SPLIT_PART(COALESCE("p"."full_name", ''), ' ', 2) <> ''
            THEN ' ' || LEFT(SPLIT_PART("p"."full_name", ' ', 2), 1) || '.'
          ELSE ''
        END
      ),
      ''
    ) AS "author_name",
    -- Seed/demo accounts must not reach a public surface. Same predicate as
    -- `isDemoEmail` (src/data/admin-users/guards.ts) and admin-users.ts, applied here
    -- so the caller never needs `profiles` — or `traveler_id` — to make that call.
    (
      "p"."email" ILIKE '%@example.com' OR "p"."email" ILIKE '%@provodnik.test'
    ) AS "author_is_demo"
  FROM "public"."reviews" "r"
  JOIN "public"."profiles" "p" ON "p"."id" = "r"."traveler_id"
  WHERE "r"."status" = 'published'::"public"."review_status";

ALTER VIEW "public"."v_public_reviews" OWNER TO "postgres";

REVOKE ALL ON TABLE "public"."v_public_reviews" FROM PUBLIC;
GRANT SELECT ON TABLE "public"."v_public_reviews" TO "anon";
GRANT SELECT ON TABLE "public"."v_public_reviews" TO "authenticated";
GRANT SELECT ON TABLE "public"."v_public_reviews" TO "service_role";

COMMENT ON VIEW "public"."v_public_reviews" IS
  'Anonymous-safe projection of published reviews: no traveler_id, author rendered as first name + last initial. Public review blocks read this instead of joining profiles (which anon RLS blocks).';
