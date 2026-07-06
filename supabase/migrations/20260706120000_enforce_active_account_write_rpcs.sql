-- Row #35 (P0 SEC): suspended/archived accounts could still perform writes.
-- The five SECURITY DEFINER write RPCs bypass RLS entirely, so an account with
-- a still-valid access token (before its JWT TTL lapses) could accept offers,
-- counter, open disputes, submit reviews, and send Q&A messages even after
-- suspension. Add a shared account-status assertion and call it at the top of
-- each write RPC. Pairs with the GoTrue ban (revokes refresh tokens) and the
-- traveler-request/open-request-member RLS guards.

CREATE OR REPLACE FUNCTION public.assert_active_account()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  -- Fail closed: a missing profile (NULL) is treated as not-active.
  IF public.profile_account_status_for((SELECT auth.uid())) IS DISTINCT FROM 'active'::public.account_status THEN
    RAISE EXCEPTION 'account_not_active' USING ERRCODE = '42501';
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.assert_active_account() FROM public;
GRANT EXECUTE ON FUNCTION public.assert_active_account() TO authenticated, service_role;

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
  PERFORM public.assert_active_account();

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



CREATE OR REPLACE FUNCTION public.counter_offer(p_offer_id uuid, p_price_minor integer, p_message text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
  PERFORM public.assert_active_account();

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
$function$;



CREATE OR REPLACE FUNCTION public.open_dispute(p_booking_id uuid, p_reason text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
  PERFORM public.assert_active_account();

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
$function$;



CREATE OR REPLACE FUNCTION public.submit_review(p_booking_id uuid, p_guide_id uuid, p_listing_id uuid, p_overall integer, p_body text, p_material integer, p_engagement integer, p_knowledge integer, p_route integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
  PERFORM public.assert_active_account();

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
$function$;



CREATE OR REPLACE FUNCTION public.send_qa_message(p_thread_id uuid, p_sender_id uuid, p_sender_role message_sender_role, p_body text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_sender_id UUID := (SELECT auth.uid()::uuid);
  v_offer_id  UUID;
  v_count     INTEGER;
BEGIN
  IF v_sender_id IS NULL OR p_sender_id IS DISTINCT FROM v_sender_id THEN
    RAISE EXCEPTION 'unauthorized_sender';
  END IF;
  PERFORM public.assert_active_account();

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
$function$;


