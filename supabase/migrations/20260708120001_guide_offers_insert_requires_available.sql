-- Tighten guide_offers_insert: a guide must be approved AND currently available
-- (accepting new work) to submit a new offer. Mirrors the app gate in
-- src/features/guide/offer-actions.ts. Preserves the prior account_status and
-- admin conditions from 20260702143000_enforce_active_account_for_guide_offers.sql;
-- only adds the is_available conjunct. Existing offers/bookings are untouched.

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
          AND gp.is_available = true
      )
    )
    OR public.is_admin()
  );
