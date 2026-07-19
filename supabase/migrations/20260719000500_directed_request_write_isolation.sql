-- Items 8 & 9 follow-up — directed-request privacy must hold on the WRITE side too.
--
-- 20260719000400 tightened SELECT so a request addressed to a specific guide
-- (target_guide_id set) is visible only to owner, that guide, and admins. But the
-- INSERT policies on guide_offers and open_request_members were left unchanged:
-- they check only "am I an approved guide / the traveler", never whether the target
-- request is addressed to someone else. An actor who obtains the request id can thus
-- offer on, or join, a private request addressed to a different guide — contradicting
-- the privacy guarantee. RLS is the security boundary, so close it at the write side.
--
-- Both policies below reproduce the CURRENT production predicate verbatim and add a
-- single AND-guard: the target request must not be directed to a different party.
-- Non-directed (target_guide_id IS NULL) open requests are unaffected — legitimate
-- offers and assembly joins continue to work exactly as before.

-- guide_offers: an approved, active, non-blocked guide may offer only on a request
-- that is either open to anyone (target_guide_id IS NULL) or addressed to them.
DROP POLICY IF EXISTS "guide_offers_insert" ON public.guide_offers;
CREATE POLICY "guide_offers_insert"
  ON public.guide_offers
  FOR INSERT
  WITH CHECK (
    (
      ((SELECT auth.uid()) = guide_id)
      AND (public.profile_account_status_for(guide_id) = 'active'::public.account_status)
      AND EXISTS (
        SELECT 1 FROM public.guide_profiles gp
        WHERE gp.user_id = guide_offers.guide_id
          AND gp.verification_status = 'approved'::public.guide_verification_status
          AND gp.is_available = true
      )
      AND (NOT public.guide_interval_blocked(guide_id, starts_at, ends_at))
      AND EXISTS (
        SELECT 1 FROM public.traveler_requests tr
        WHERE tr.id = guide_offers.request_id
          AND (tr.target_guide_id IS NULL OR tr.target_guide_id = (SELECT auth.uid()))
      )
    )
    OR public.is_admin()
  );

-- open_request_members: a traveler may join only a request that is open to everyone.
-- A directed (private) request is never an assembly group and must not be joinable.
DROP POLICY IF EXISTS "open_request_members_insert" ON public.open_request_members;
CREATE POLICY "open_request_members_insert"
  ON public.open_request_members
  FOR INSERT
  WITH CHECK (
    (
      ((SELECT auth.uid()) = traveler_id)
      AND (public.profile_account_status_for(traveler_id) = 'active'::public.account_status)
      AND EXISTS (
        SELECT 1 FROM public.traveler_requests tr
        WHERE tr.id = open_request_members.request_id
          AND tr.target_guide_id IS NULL
      )
    )
    OR public.is_admin()
  );
