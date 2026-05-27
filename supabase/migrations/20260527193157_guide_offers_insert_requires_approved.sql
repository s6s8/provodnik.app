-- Self-heal bug 48be5d99: harden RLS so unverified guides cannot insert offers.
--
-- Before: guide_offers_insert allowed any authenticated user where auth.uid()=guide_id.
-- The application-layer gate (submitOfferAction) could be bypassed by direct
-- PostgREST writes using the user's JWT — contradicting the "verified private
-- guides" promise.
--
-- After: a guide may insert their own offer only when their guide_profiles row
-- has verification_status='approved'. Admins remain exempt. Counter-offer policy
-- (guide_offers_insert_request_owner_counter) is unchanged — that flow lets a
-- traveler create a counter on behalf of an already-existing offer's guide and
-- has its own self-referencing guard.

DROP POLICY IF EXISTS "guide_offers_insert" ON public.guide_offers;

CREATE POLICY "guide_offers_insert"
  ON public.guide_offers
  FOR INSERT
  WITH CHECK (
    (
      (SELECT auth.uid()) = guide_id
      AND EXISTS (
        SELECT 1
        FROM public.guide_profiles gp
        WHERE gp.user_id = guide_id
          AND gp.verification_status = 'approved'::public.guide_verification_status
      )
    )
    OR public.is_admin()
  );
