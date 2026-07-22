-- #39 follow-up — a traveler's direct INSERT must not carry preferred_guide_slug.
--
-- traveler_requests_insert already forbids target_guide_id and template lineage on a
-- direct insert, but preferred_guide_slug was still writable. A forged PostgREST insert
-- with { preferred_guide_slug: 'ghost-guide', target_guide_id: null } bypasses the RPC
-- and surfaces in v_public_open_requests because that view gates only on target_guide_id.
-- Slug resolution and display-only slug persistence belong to create_directed_traveler_request.

DROP POLICY IF EXISTS "traveler_requests_insert" ON public.traveler_requests;

CREATE POLICY "traveler_requests_insert" ON public.traveler_requests
  FOR INSERT
  WITH CHECK (
    (
      (SELECT auth.uid()) = traveler_id
      AND public.profile_account_status_for(traveler_id) = 'active'::public.account_status
      -- A directed request is private to the addressed guide. Choosing that addressee
      -- is not the client's authority: it goes through create_directed_traveler_request.
      AND target_guide_id IS NULL
      -- Nor is authoring the excursion the request claims to be for.
      AND guide_template_id IS NULL
      AND guide_template_snapshot IS NULL
      -- Nor may a client pre-select a guide slug; the RPC resolves it to target_guide_id.
      AND preferred_guide_slug IS NULL
    )
    OR public.is_admin()
  );
