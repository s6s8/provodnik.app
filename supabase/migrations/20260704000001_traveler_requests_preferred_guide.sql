-- №28: "Запросить этого гида" on the public guide page previously sent a dead
-- `?guide=<slug>` query param that the request form ignored. Persist the
-- preselected guide on the request so guides/admin can see who was asked for.
--
-- Plain text (no FK): the slug is display metadata; a guide renaming their slug
-- must not break or cascade into historical requests.

ALTER TABLE "public"."traveler_requests"
  ADD COLUMN IF NOT EXISTS "preferred_guide_slug" "text";

COMMENT ON COLUMN "public"."traveler_requests"."preferred_guide_slug" IS
  'Slug of the guide preselected via the guide-page CTA («Запросить этого гида»). Metadata only, no FK.';
