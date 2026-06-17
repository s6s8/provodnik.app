-- fix(audit b2c2): accept_offer created bookings with party_size hardcoded to 1,
-- ignoring how many people the traveler requested. Use the request's participants_count.
-- CREATE OR REPLACE (preserves grants); matches the LIVE single-arg signature.
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
  v_participants_count INTEGER;
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

  SELECT participants_count INTO v_participants_count
  FROM public.traveler_requests
  WHERE id = v_request_id;

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
    COALESCE(v_participants_count, 1),
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
$function$;
