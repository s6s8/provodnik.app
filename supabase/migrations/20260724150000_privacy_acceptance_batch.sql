-- Privacy acceptance batch (#58, #82, #88).
--
-- #58: published ready excursions must not expose meeting_point on the public read surface.
-- #88: public request discovery must include only joinable assembly requests (no closed/private rows).
-- Directed-request privacy (#82) remains on traveler_requests RLS + v_public_open_requests gates.

-- ---------------------------------------------------------------------------
-- #58 — public ready-excursion projection without meeting_point
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.v_public_published_guide_templates AS
  SELECT
    gt.id,
    gt.guide_id,
    gt.title,
    gt.description,
    gt.duration_text,
    gt.price_from_kopecks,
    gt.price_scope,
    gt.max_participants,
    gt.region,
    gt.category,
    gt.photo_urls,
    gt.status,
    gt.rejection_reason,
    gt.created_at,
    gt.updated_at
  FROM public.guide_templates gt
  WHERE gt.status = 'published'::text;

COMMENT ON VIEW public.v_public_published_guide_templates IS
  'Public catalog/detail projection for published guide templates. meeting_point is withheld until a booking is confirmed.';

REVOKE ALL ON TABLE public.v_public_published_guide_templates FROM PUBLIC;
GRANT SELECT ON TABLE public.v_public_published_guide_templates TO anon, authenticated, service_role;

-- Public catalog reads must go through the projection; raw published rows stay guide-owned.
DROP POLICY IF EXISTS guide_templates_select_published ON public.guide_templates;

-- ---------------------------------------------------------------------------
-- #88 — only joinable assembly requests in the public discovery view
-- ---------------------------------------------------------------------------

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
    FROM public.traveler_requests tr
   WHERE status = 'open'::public.request_status
     AND target_guide_id IS NULL
     AND preferred_guide_slug IS NULL
     AND open_to_join = true
     AND format_preference = 'group'::text
     AND admin_blocked_at IS NULL
     AND deleted_at IS NULL;
