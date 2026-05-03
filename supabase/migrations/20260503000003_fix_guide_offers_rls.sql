-- Fix RLS infinite recursion (42P17) on guide_offers.
-- The "guide_offers_insert_request_owner_counter" policy's WITH CHECK referenced
-- guide_offers itself via "EXISTS (SELECT 1 FROM guide_offers prior ...)", causing
-- Postgres to recurse infinitely when evaluating the INSERT policy.
-- Fix: wrap the self-referencing subquery in a SECURITY DEFINER function that
-- bypasses RLS, eliminating the cycle.

CREATE OR REPLACE FUNCTION public.guide_offer_exists_for_counter(
  p_request_id uuid,
  p_guide_id   uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.guide_offers
    WHERE request_id = p_request_id
      AND guide_id   = p_guide_id
  );
$$;

-- Re-create the INSERT policy using the helper function
DROP POLICY IF EXISTS "guide_offers_insert_request_owner_counter" ON public.guide_offers;

CREATE POLICY "guide_offers_insert_request_owner_counter"
  ON public.guide_offers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.traveler_requests tr
      WHERE tr.id            = guide_offers.request_id
        AND tr.traveler_id   = (SELECT auth.uid())
    )
    AND public.guide_offer_exists_for_counter(
          guide_offers.request_id,
          guide_offers.guide_id
        )
  );
