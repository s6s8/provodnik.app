-- Fix: offer acceptance had two divergent, non-atomic authorities and trusted
-- client-supplied guide/price.
--
-- Root cause: the atomic public.accept_offer RPC (SECURITY DEFINER, derives
-- guide_id/price from the offer row server-side) was orphaned — no caller. Instead:
--   * acceptOfferAction (owner-request page) ran a 4-step non-atomic sequence and
--     passed FORM-supplied guide_id / price_minor into the booking, so a request
--     owner could book a different guide or a lower price; parallel accepts could
--     create two bookings.
--   * messaging acceptOffer only flipped the offer to 'accepted' — no booking, no
--     sibling decline, no request update.
--
-- Fix: make accept_offer the single authority and complete it so both UI paths can
-- use it with no behavior loss:
--   * reject expired offers (the owner-page path never checked expiry),
--   * seed the face-to-face payment_agreements row createBooking used to write,
--   * return the booking id (was the thread id) so callers can redirect.
-- guide_id, price_minor, currency, starts_at are still read only from the offer row;
-- nothing is trusted from the client except p_offer_id. Sibling offers are declined
-- and the request is booked inside the same transaction, so parallel accepts resolve
-- to exactly one winner (the second sees status <> 'pending' and raises).
--
-- Rollback: re-apply the accept_offer body from
-- 20260702000000_current_schema_baseline.sql (forward-only repair).

CREATE OR REPLACE FUNCTION public.accept_offer(p_offer_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_traveler_id UUID := (SELECT auth.uid()::uuid);
  v_request_id  UUID;
  v_guide_id    UUID;
  v_price_minor INTEGER;
  v_currency    TEXT;
  v_starts_at   TIMESTAMPTZ;
  v_expires_at  TIMESTAMPTZ;
  v_participants_count INTEGER;
  v_booking_id  UUID;
  v_thread_id   UUID;
BEGIN
  IF v_traveler_id IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  PERFORM public.assert_active_account();

  -- Lock the offer row so two concurrent accepts serialize on it.
  SELECT request_id, guide_id, price_minor, currency, starts_at, expires_at
  INTO v_request_id, v_guide_id, v_price_minor, v_currency, v_starts_at, v_expires_at
  FROM public.guide_offers
  WHERE id = p_offer_id
    AND status = 'pending'
  FOR UPDATE;

  IF v_request_id IS NULL THEN
    RAISE EXCEPTION 'offer_not_found';
  END IF;

  IF v_expires_at IS NOT NULL AND v_expires_at <= now() THEN
    RAISE EXCEPTION 'offer_expired';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.traveler_requests
    WHERE id = v_request_id AND traveler_id = v_traveler_id
  ) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT participants_count INTO v_participants_count
  FROM public.traveler_requests WHERE id = v_request_id;

  UPDATE public.guide_offers
  SET status = 'accepted', updated_at = NOW()
  WHERE id = p_offer_id;

  UPDATE public.guide_offers
  SET status = 'declined', updated_at = NOW()
  WHERE request_id = v_request_id AND id != p_offer_id AND status = 'pending';

  UPDATE public.traveler_requests
  SET status = 'booked', updated_at = NOW()
  WHERE id = v_request_id;

  INSERT INTO public.bookings (
    traveler_id, guide_id, request_id, offer_id, status, party_size,
    subtotal_minor, currency, starts_at, cancellation_policy_snapshot
  )
  VALUES (
    v_traveler_id, v_guide_id, v_request_id, p_offer_id, 'awaiting_guide_confirmation',
    COALESCE(v_participants_count, 1), v_price_minor, COALESCE(v_currency, 'RUB'),
    v_starts_at, '{}'::jsonb
  )
  RETURNING id INTO v_booking_id;

  -- Face-to-face payment record (createBooking used to seed this).
  INSERT INTO public.payment_agreements (booking_id, agreed_total_minor, currency, method)
  VALUES (v_booking_id, v_price_minor, COALESCE(v_currency, 'RUB'), 'in_person');

  INSERT INTO public.conversation_threads (subject_type, booking_id, created_by)
  VALUES ('booking', v_booking_id, v_traveler_id)
  RETURNING id INTO v_thread_id;

  RETURN v_booking_id;
END;
$function$;
