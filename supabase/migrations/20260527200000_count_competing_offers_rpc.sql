-- count_competing_offers: SECURITY DEFINER helper that returns the number of
-- pending offers on a traveler request. Used on the guide request detail page
-- to surface competition signal — guides RLS-cannot read other guides' rows
-- directly, so this function bypasses RLS to return only an aggregate count.

CREATE OR REPLACE FUNCTION public.count_competing_offers(p_request_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $func$
  SELECT count(*)::integer
  FROM public.guide_offers
  WHERE request_id = p_request_id
    AND status = 'pending'::public.offer_status;
$func$;

GRANT EXECUTE ON FUNCTION public.count_competing_offers(uuid) TO authenticated, anon;
