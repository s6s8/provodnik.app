-- Atomically:
--   1. Accept one offer
--   2. Decline all other pending offers for the same request
--   3. Mark request as booked
--   4. Insert a booking row
--   5. Create a booking conversation thread (booking_id only — constraint requires this)
-- Returns the new booking's conversation_thread id.
CREATE OR REPLACE FUNCTION public.accept_offer(
  p_offer_id    UUID,
  p_traveler_id UUID
)
RETURNS UUID  -- the booking conversation_thread id
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id   UUID;
  v_guide_id     UUID;
  v_price_minor  INTEGER;
  v_currency     TEXT;
  v_starts_at    TIMESTAMPTZ;
  v_booking_id   UUID;
  v_thread_id    UUID;
BEGIN
  -- Verify offer exists, is pending, and get its data
  SELECT request_id, guide_id, price_minor, currency, starts_at
  INTO v_request_id, v_guide_id, v_price_minor, v_currency, v_starts_at
  FROM guide_offers
  WHERE id = p_offer_id AND status = 'pending';

  IF v_request_id IS NULL THEN
    RAISE EXCEPTION 'offer_not_found';
  END IF;

  -- Verify the traveler owns this request
  IF NOT EXISTS (
    SELECT 1 FROM traveler_requests
    WHERE id = v_request_id AND traveler_id = p_traveler_id
  ) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- 1. Accept this offer
  UPDATE guide_offers
  SET status = 'accepted', updated_at = NOW()
  WHERE id = p_offer_id;

  -- 2. Decline all other pending offers for this request
  UPDATE guide_offers
  SET status = 'declined', updated_at = NOW()
  WHERE request_id = v_request_id
    AND id != p_offer_id
    AND status = 'pending';

  -- 3. Mark request as booked
  UPDATE traveler_requests
  SET status = 'booked', updated_at = NOW()
  WHERE id = v_request_id;

  -- 4. Create a booking row
  INSERT INTO bookings (
    traveler_id, guide_id, request_id, offer_id,
    status, party_size, subtotal_minor, currency,
    starts_at, cancellation_policy_snapshot
  )
  VALUES (
    p_traveler_id, v_guide_id, v_request_id, p_offer_id,
    'awaiting_guide_confirmation', 1, v_price_minor, COALESCE(v_currency, 'RUB'),
    v_starts_at, '{}'::jsonb
  )
  RETURNING id INTO v_booking_id;

  -- 5. Create a booking conversation thread (booking_id only — constraint requires this)
  INSERT INTO conversation_threads (subject_type, booking_id, created_by)
  VALUES ('booking', v_booking_id, p_traveler_id)
  RETURNING id INTO v_thread_id;

  RETURN v_thread_id;
END;
$$;

-- Only authenticated users can call this
REVOKE ALL ON FUNCTION public.accept_offer(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_offer(UUID, UUID) TO authenticated;
