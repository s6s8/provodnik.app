DROP FUNCTION IF EXISTS public.accept_offer(UUID, UUID);
DROP FUNCTION IF EXISTS public.accept_offer(UUID);

CREATE FUNCTION public.accept_offer(
  p_offer_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_traveler_id UUID := (SELECT auth.uid()::uuid);
  v_request_id  UUID;
  v_guide_id    UUID;
  v_price_minor INTEGER;
  v_currency    TEXT;
  v_starts_at   TIMESTAMPTZ;
  v_booking_id  UUID;
  v_thread_id   UUID;
BEGIN
  IF v_traveler_id IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT request_id, guide_id, price_minor, currency, starts_at
  INTO v_request_id, v_guide_id, v_price_minor, v_currency, v_starts_at
  FROM public.guide_offers
  WHERE id = p_offer_id
    AND status = 'pending';

  IF v_request_id IS NULL THEN
    RAISE EXCEPTION 'offer_not_found';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.traveler_requests
    WHERE id = v_request_id
      AND traveler_id = v_traveler_id
  ) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  UPDATE public.guide_offers
  SET status = 'accepted', updated_at = NOW()
  WHERE id = p_offer_id;

  UPDATE public.guide_offers
  SET status = 'declined', updated_at = NOW()
  WHERE request_id = v_request_id
    AND id != p_offer_id
    AND status = 'pending';

  UPDATE public.traveler_requests
  SET status = 'booked', updated_at = NOW()
  WHERE id = v_request_id;

  INSERT INTO public.bookings (
    traveler_id,
    guide_id,
    request_id,
    offer_id,
    status,
    party_size,
    subtotal_minor,
    currency,
    starts_at,
    cancellation_policy_snapshot
  )
  VALUES (
    v_traveler_id,
    v_guide_id,
    v_request_id,
    p_offer_id,
    'awaiting_guide_confirmation',
    1,
    v_price_minor,
    COALESCE(v_currency, 'RUB'),
    v_starts_at,
    '{}'::jsonb
  )
  RETURNING id INTO v_booking_id;

  INSERT INTO public.conversation_threads (subject_type, booking_id, created_by)
  VALUES ('booking', v_booking_id, v_traveler_id)
  RETURNING id INTO v_thread_id;

  RETURN v_thread_id;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_offer(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_offer(UUID) TO authenticated;

DROP FUNCTION IF EXISTS public.send_qa_message(UUID, UUID, public.message_sender_role, TEXT);

CREATE FUNCTION public.send_qa_message(
  p_thread_id   UUID,
  p_sender_id   UUID,
  p_sender_role public.message_sender_role,
  p_body        TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id UUID := (SELECT auth.uid()::uuid);
  v_offer_id  UUID;
  v_count     INTEGER;
BEGIN
  IF v_sender_id IS NULL OR p_sender_id IS DISTINCT FROM v_sender_id THEN
    RAISE EXCEPTION 'unauthorized_sender';
  END IF;

  SELECT offer_id
  INTO v_offer_id
  FROM public.conversation_threads
  WHERE id = p_thread_id
    AND subject_type = 'offer'
    AND offer_id IS NOT NULL;

  IF v_offer_id IS NULL OR NOT public.can_access_offer_thread(v_offer_id, v_sender_id) THEN
    RAISE EXCEPTION 'unauthorized_thread';
  END IF;

  SELECT COUNT(*)
  INTO v_count
  FROM public.messages
  WHERE thread_id = p_thread_id;

  IF v_count >= 8 THEN
    RAISE EXCEPTION 'qa_thread_at_limit';
  END IF;

  INSERT INTO public.messages (thread_id, sender_id, sender_role, body)
  VALUES (p_thread_id, p_sender_id, p_sender_role, p_body);
END;
$$;

REVOKE ALL ON FUNCTION public.send_qa_message(UUID, UUID, public.message_sender_role, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_qa_message(UUID, UUID, public.message_sender_role, TEXT) TO authenticated;
