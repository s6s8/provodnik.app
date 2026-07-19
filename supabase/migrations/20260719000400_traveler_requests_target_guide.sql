-- Items 8 & 9 — a direct request to a named guide must be truly private.
--
-- Today a "direct" request carries only preferred_guide_slug: display-only text, no FK,
-- no privacy effect. The request still appears on the homepage «Сборные группы», in the
-- public marketplace, in search, in the sitemap, and in every guide's inbox — and the
-- new-request notification fans out to all matching guides. That is the bug.
--
-- Introduce a real server-resolved target_guide_id FK and gate visibility to owner,
-- addressed guide, and admin only. App-layer queries additionally keep directed rows out
-- of every public discovery surface (they belong only in the addressed guide's inbox).

ALTER TABLE public.traveler_requests
  ADD COLUMN IF NOT EXISTS target_guide_id uuid
  REFERENCES public.guide_profiles(user_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS traveler_requests_target_guide_id_idx
  ON public.traveler_requests (target_guide_id)
  WHERE target_guide_id IS NOT NULL;

COMMENT ON COLUMN public.traveler_requests.target_guide_id IS
  'When set, the request is addressed privately to this guide: visible only to owner, that guide, and admins; excluded from all public discovery. Authority for direct-request privacy (preferred_guide_slug is display-only legacy).';

-- Backfill from the legacy display-only slug marker (fully resolvable on live data).
UPDATE public.traveler_requests tr
   SET target_guide_id = gp.user_id
  FROM public.guide_profiles gp
 WHERE gp.slug = tr.preferred_guide_slug
   AND tr.preferred_guide_slug IS NOT NULL
   AND tr.target_guide_id IS NULL;

-- Tighten row-level security: a directed request is NOT visible under the generic
-- "any authenticated user sees open requests" branch. Only owner, addressed guide, admin.
DROP POLICY IF EXISTS traveler_requests_select ON public.traveler_requests;
CREATE POLICY traveler_requests_select ON public.traveler_requests FOR SELECT USING (
  ((SELECT auth.uid()) = traveler_id)
  OR is_admin()
  OR (target_guide_id IS NOT NULL AND (SELECT auth.uid()) = target_guide_id)
  OR ((SELECT auth.uid()) IS NOT NULL AND status = 'open'::request_status AND target_guide_id IS NULL)
);

-- The public (anon) view must never surface a directed request. Same column list as the
-- existing view (notes already nulled by 20260719000000); only the WHERE clause tightens.
CREATE OR REPLACE VIEW public.v_public_open_requests AS
  SELECT id,
         destination,
         region,
         interests,
         starts_on,
         ends_on,
         start_time,
         end_time,
         budget_minor,
         currency,
         participants_count,
         format_preference,
         NULL::text AS notes,
         open_to_join,
         group_capacity,
         status,
         created_at,
         date_flexibility,
         date_locked,
         time_locked,
         requested_languages
    FROM traveler_requests tr
   WHERE status = 'open'::request_status
     AND target_guide_id IS NULL;
