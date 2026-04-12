-- Traveler-facing offer actions in thread: accept / decline / counter-offer
ALTER TYPE public.offer_status ADD VALUE IF NOT EXISTS 'counter_offered';

CREATE POLICY "guide_offers_update_request_owner"
  ON public.guide_offers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.traveler_requests tr
      WHERE tr.id = guide_offers.request_id
        AND tr.traveler_id = (SELECT auth.uid()::uuid)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.traveler_requests tr
      WHERE tr.id = guide_offers.request_id
        AND tr.traveler_id = (SELECT auth.uid()::uuid)
    )
  );

CREATE POLICY "guide_offers_insert_request_owner_counter"
  ON public.guide_offers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.traveler_requests tr
      WHERE tr.id = guide_offers.request_id
        AND tr.traveler_id = (SELECT auth.uid()::uuid)
    )
    AND EXISTS (
      SELECT 1
      FROM public.guide_offers prior
      WHERE prior.request_id = guide_offers.request_id
        AND prior.guide_id = guide_offers.guide_id
    )
  );
