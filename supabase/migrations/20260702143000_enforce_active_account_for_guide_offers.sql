-- Suspended/archived guides must not be able to create or mutate their offers.
-- Admin status controls already update public.profiles.account_status; enforce it
-- at the DB boundary too so cached UI/session state cannot bypass the block.

DROP POLICY IF EXISTS "guide_offers_insert" ON public.guide_offers;

CREATE POLICY "guide_offers_insert" ON public.guide_offers
  FOR INSERT
  WITH CHECK (
    (
      (SELECT auth.uid()) = guide_id
      AND public.profile_account_status_for(guide_id) = 'active'::public.account_status
      AND EXISTS (
        SELECT 1
        FROM public.guide_profiles gp
        WHERE gp.user_id = guide_offers.guide_id
          AND gp.verification_status = 'approved'::public.guide_verification_status
      )
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "guide_offers_update" ON public.guide_offers;

CREATE POLICY "guide_offers_update" ON public.guide_offers
  FOR UPDATE
  USING (
    (
      (SELECT auth.uid()) = guide_id
      AND public.profile_account_status_for(guide_id) = 'active'::public.account_status
    )
    OR public.is_admin()
  )
  WITH CHECK (
    (
      (SELECT auth.uid()) = guide_id
      AND public.profile_account_status_for(guide_id) = 'active'::public.account_status
    )
    OR public.is_admin()
  );
