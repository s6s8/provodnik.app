-- Fix: aggregate request cancellation was non-atomic.
--
-- cancelRequestAction updated traveler_requests -> 'cancelled', then in a SEPARATE
-- statement updated the linked bookings -> 'cancelled'. If the second failed (or the
-- process died between them), the request was cancelled while its booking stayed
-- 'confirmed'/'awaiting_guide_confirmation' — a cancelled request with a live booking.
--
-- Fix: one transactional authority. cancel_traveler_request verifies the caller owns
-- the request and that it is cancellable, then cancels the request AND its active
-- bookings in the same transaction. Ownership/price/state are derived server-side.
--
-- Rollback: drop function cancel_traveler_request (forward-only; the app falls back
-- to the previous two-statement path only if this is reverted, which nothing else
-- depends on).

CREATE OR REPLACE FUNCTION public.cancel_traveler_request(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid    UUID := (SELECT auth.uid()::uuid);
  v_owner  UUID;
  v_status request_status;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT traveler_id, status INTO v_owner, v_status
  FROM public.traveler_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'request_not_found';
  END IF;
  IF v_owner <> v_uid THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF v_status NOT IN ('open', 'booked') THEN
    RAISE EXCEPTION 'not_cancellable';
  END IF;

  UPDATE public.traveler_requests
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = p_request_id;

  UPDATE public.bookings
  SET status = 'cancelled', updated_at = NOW()
  WHERE request_id = p_request_id
    AND status IN ('awaiting_guide_confirmation', 'confirmed');
END;
$function$;

GRANT EXECUTE ON FUNCTION public.cancel_traveler_request(uuid) TO authenticated;
