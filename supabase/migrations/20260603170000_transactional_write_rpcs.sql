DROP FUNCTION IF EXISTS public.counter_offer(UUID, INTEGER, TEXT);
DROP FUNCTION IF EXISTS public.counter_offer(UUID, BIGINT, TEXT);

CREATE FUNCTION public.counter_offer(
  p_offer_id UUID,
  p_price_minor INTEGER,
  p_message TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor_id UUID := (SELECT auth.uid()::uuid);
  v_request_id UUID;
  v_traveler_id UUID;
  v_guide_id UUID;
  v_listing_id UUID;
  v_title TEXT;
  v_currency TEXT;
  v_capacity INTEGER;
  v_starts_at TIMESTAMPTZ;
  v_ends_at TIMESTAMPTZ;
  v_inclusions TEXT[];
  v_expires_at TIMESTAMPTZ;
  v_status public.offer_status;
  v_route_stops JSONB;
  v_route_duration_minutes INTEGER;
  v_counter_offer_id UUID;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF p_price_minor IS NULL OR p_price_minor < 0 THEN
    RAISE EXCEPTION 'invalid_price';
  END IF;

  SELECT
    go.request_id,
    tr.traveler_id,
    go.guide_id,
    go.listing_id,
    go.title,
    go.currency,
    go.capacity,
    go.starts_at,
    go.ends_at,
    go.inclusions,
    go.expires_at,
    go.status,
    go.route_stops,
    go.route_duration_minutes
  INTO
    v_request_id,
    v_traveler_id,
    v_guide_id,
    v_listing_id,
    v_title,
    v_currency,
    v_capacity,
    v_starts_at,
    v_ends_at,
    v_inclusions,
    v_expires_at,
    v_status,
    v_route_stops,
    v_route_duration_minutes
  FROM public.guide_offers go
  JOIN public.traveler_requests tr ON tr.id = go.request_id
  WHERE go.id = p_offer_id
  FOR UPDATE OF go;

  IF v_request_id IS NULL THEN
    RAISE EXCEPTION 'offer_not_found';
  END IF;

  IF v_traveler_id IS DISTINCT FROM v_actor_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF v_status IS DISTINCT FROM 'pending'::public.offer_status THEN
    RAISE EXCEPTION 'offer_not_pending';
  END IF;

  UPDATE public.guide_offers
  SET status = 'counter_offered'::public.offer_status,
      updated_at = timezone('utc', now())
  WHERE id = p_offer_id
    AND status = 'pending'::public.offer_status;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'offer_not_pending';
  END IF;

  INSERT INTO public.guide_offers (
    request_id,
    guide_id,
    listing_id,
    title,
    message,
    price_minor,
    currency,
    capacity,
    starts_at,
    ends_at,
    inclusions,
    expires_at,
    status,
    route_stops,
    route_duration_minutes
  )
  VALUES (
    v_request_id,
    v_guide_id,
    v_listing_id,
    v_title,
    NULLIF(BTRIM(p_message), ''),
    p_price_minor,
    COALESCE(v_currency, 'RUB'),
    v_capacity,
    v_starts_at,
    v_ends_at,
    COALESCE(v_inclusions, '{}'::text[]),
    v_expires_at,
    'pending'::public.offer_status,
    COALESCE(v_route_stops, '[]'::jsonb),
    v_route_duration_minutes
  )
  RETURNING id INTO v_counter_offer_id;

  RETURN v_counter_offer_id;
END;
$$;

REVOKE ALL ON FUNCTION public.counter_offer(UUID, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.counter_offer(UUID, INTEGER, TEXT) TO authenticated;

DROP FUNCTION IF EXISTS public.open_dispute(UUID, TEXT);

CREATE FUNCTION public.open_dispute(
  p_booking_id UUID,
  p_reason TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor_id UUID := (SELECT auth.uid()::uuid);
  v_traveler_id UUID;
  v_guide_id UUID;
  v_status public.booking_status;
  v_reason TEXT := NULLIF(BTRIM(p_reason), '');
  v_dispute_id UUID;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF v_reason IS NULL THEN
    RAISE EXCEPTION 'invalid_dispute_reason';
  END IF;

  SELECT traveler_id, guide_id, status
  INTO v_traveler_id, v_guide_id, v_status
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF v_traveler_id IS NULL THEN
    RAISE EXCEPTION 'booking_not_found';
  END IF;

  IF v_actor_id IS DISTINCT FROM v_traveler_id
    AND v_actor_id IS DISTINCT FROM v_guide_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF v_status = 'disputed'::public.booking_status THEN
    RAISE EXCEPTION 'booking_already_disputed';
  END IF;

  IF v_status IN (
    'cancelled'::public.booking_status,
    'no_show'::public.booking_status
  ) THEN
    RAISE EXCEPTION 'booking_not_disputable';
  END IF;

  UPDATE public.bookings
  SET status = 'disputed'::public.booking_status,
      updated_at = timezone('utc', now())
  WHERE id = p_booking_id;

  INSERT INTO public.disputes (
    booking_id,
    opened_by,
    status,
    reason
  )
  VALUES (
    p_booking_id,
    v_actor_id,
    'open',
    v_reason
  )
  RETURNING id INTO v_dispute_id;

  INSERT INTO public.dispute_events (
    dispute_id,
    actor_id,
    event_type,
    payload
  )
  VALUES (
    v_dispute_id,
    v_actor_id,
    'opened',
    jsonb_build_object(
      'booking_id', p_booking_id,
      'reason', v_reason
    )
  );

  RETURN v_dispute_id;
END;
$$;

REVOKE ALL ON FUNCTION public.open_dispute(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.open_dispute(UUID, TEXT) TO authenticated;

DROP FUNCTION IF EXISTS public.submit_review(UUID, UUID, UUID, INTEGER, TEXT, INTEGER, INTEGER, INTEGER, INTEGER);

CREATE FUNCTION public.submit_review(
  p_booking_id UUID,
  p_guide_id UUID,
  p_listing_id UUID,
  p_overall INTEGER,
  p_body TEXT,
  p_material INTEGER,
  p_engagement INTEGER,
  p_knowledge INTEGER,
  p_route INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor_id UUID := (SELECT auth.uid()::uuid);
  v_traveler_id UUID;
  v_booking_guide_id UUID;
  v_booking_listing_id UUID;
  v_booking_status public.booking_status;
  v_resolved_listing_id UUID;
  v_review_id UUID;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF p_overall NOT BETWEEN 1 AND 5
    OR p_material NOT BETWEEN 1 AND 5
    OR p_engagement NOT BETWEEN 1 AND 5
    OR p_knowledge NOT BETWEEN 1 AND 5
    OR p_route NOT BETWEEN 1 AND 5 THEN
    RAISE EXCEPTION 'invalid_review_score';
  END IF;

  SELECT traveler_id, guide_id, listing_id, status
  INTO v_traveler_id, v_booking_guide_id, v_booking_listing_id, v_booking_status
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF v_traveler_id IS NULL THEN
    RAISE EXCEPTION 'booking_not_found';
  END IF;

  IF v_traveler_id IS DISTINCT FROM v_actor_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF v_booking_status IS DISTINCT FROM 'completed'::public.booking_status THEN
    RAISE EXCEPTION 'booking_not_completed';
  END IF;

  IF v_booking_guide_id IS DISTINCT FROM p_guide_id THEN
    RAISE EXCEPTION 'guide_mismatch';
  END IF;

  IF p_listing_id IS NOT NULL
    AND v_booking_listing_id IS NOT NULL
    AND v_booking_listing_id IS DISTINCT FROM p_listing_id THEN
    RAISE EXCEPTION 'listing_mismatch';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.reviews
    WHERE booking_id = p_booking_id
  ) THEN
    RAISE EXCEPTION 'review_already_exists';
  END IF;

  v_resolved_listing_id := COALESCE(p_listing_id, v_booking_listing_id);

  INSERT INTO public.reviews (
    booking_id,
    traveler_id,
    guide_id,
    listing_id,
    rating,
    body,
    status
  )
  VALUES (
    p_booking_id,
    v_actor_id,
    p_guide_id,
    v_resolved_listing_id,
    p_overall,
    NULLIF(BTRIM(p_body), ''),
    'published'::public.review_status
  )
  RETURNING id INTO v_review_id;

  INSERT INTO public.review_ratings_breakdown (review_id, axis, score)
  VALUES
    (v_review_id, 'material', p_material::smallint),
    (v_review_id, 'engagement', p_engagement::smallint),
    (v_review_id, 'knowledge', p_knowledge::smallint),
    (v_review_id, 'route', p_route::smallint);

  RETURN v_review_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_review(UUID, UUID, UUID, INTEGER, TEXT, INTEGER, INTEGER, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_review(UUID, UUID, UUID, INTEGER, TEXT, INTEGER, INTEGER, INTEGER, INTEGER) TO authenticated;
