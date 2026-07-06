-- T0: Restore hardened public request read policy. Anonymous visitors must use
-- the sanitized v_public_open_requests view instead of raw traveler_requests.
DROP POLICY IF EXISTS "traveler_requests_select" ON public.traveler_requests;

CREATE POLICY "traveler_requests_select" ON public.traveler_requests
  FOR SELECT USING (
    ((( SELECT auth.uid() AS uid) = traveler_id)
      OR public.is_admin()
      OR ((( SELECT auth.uid() AS uid) IS NOT NULL) AND (status = 'open'::public.request_status)))
  );

-- T3: Suspended/archived travelers must not create or join open requests.
-- Route guards are not enough because request creation/join flows are public-site
-- actions; keep account blocking at the RLS boundary too.
DROP POLICY IF EXISTS "traveler_requests_insert" ON public.traveler_requests;

CREATE POLICY "traveler_requests_insert" ON public.traveler_requests
  FOR INSERT
  WITH CHECK (
    (
      (SELECT auth.uid()) = traveler_id
      AND public.profile_account_status_for(traveler_id) = 'active'::public.account_status
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "open_request_members_insert" ON public.open_request_members;

CREATE POLICY "open_request_members_insert" ON public.open_request_members
  FOR INSERT
  WITH CHECK (
    (
      (SELECT auth.uid()) = traveler_id
      AND public.profile_account_status_for(traveler_id) = 'active'::public.account_status
    )
    OR public.is_admin()
  );
