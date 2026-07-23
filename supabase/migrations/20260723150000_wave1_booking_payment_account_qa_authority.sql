-- Wave 1 (#55–#57, #62, #87, #90, #91): booking commercial/state authority,
-- payment-agreement integrity, conditional traveler cancellation, extended active-
-- account write lockout, moderation authorization, and Q&A identity/quota integrity.

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_active_listing_owner(p_listing_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    public.is_admin()
    OR (
      (SELECT auth.uid()) IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.listings l
        WHERE l.id = p_listing_id
          AND l.guide_id = (SELECT auth.uid())
          AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
      )
    );
$$;

REVOKE ALL ON FUNCTION public.is_active_listing_owner(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_listing_owner(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_booking_transition_allowed(
  p_from public.booking_status,
  p_to public.booking_status
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN p_from = p_to THEN true
    WHEN p_from = 'pending' AND p_to IN (
      'confirmed', 'cancelled', 'awaiting_guide_confirmation'
    ) THEN true
    WHEN p_from = 'awaiting_guide_confirmation' AND p_to IN ('confirmed', 'cancelled') THEN true
    WHEN p_from = 'confirmed' AND p_to IN ('completed', 'cancelled', 'disputed', 'no_show') THEN true
    WHEN p_from = 'disputed' AND p_to = 'cancelled' THEN true
    ELSE false
  END;
$$;

REVOKE ALL ON FUNCTION public.is_booking_transition_allowed(public.booking_status, public.booking_status) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_booking_transition_allowed(public.booking_status, public.booking_status) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Booking transition authority (#55, #56)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.transition_booking(
  p_booking_id uuid,
  p_to_status public.booking_status
)
RETURNS public.booking_status
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := (SELECT auth.uid()::uuid);
  v_traveler_id uuid;
  v_guide_id uuid;
  v_from public.booking_status;
  v_result public.booking_status;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  PERFORM public.assert_active_account();

  SELECT traveler_id, guide_id, status
  INTO v_traveler_id, v_guide_id, v_from
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF v_traveler_id IS NULL THEN
    RAISE EXCEPTION 'booking_not_found';
  END IF;

  IF NOT public.is_booking_transition_allowed(v_from, p_to_status) THEN
    RAISE EXCEPTION 'invalid_transition';
  END IF;

  IF public.is_admin() THEN
    NULL;
  ELSIF p_to_status IN ('cancelled'::public.booking_status, 'disputed'::public.booking_status) THEN
    IF v_uid IS DISTINCT FROM v_traveler_id AND v_uid IS DISTINCT FROM v_guide_id THEN
      RAISE EXCEPTION 'unauthorized';
    END IF;
  ELSIF v_from = 'pending'::public.booking_status
    AND p_to_status = 'awaiting_guide_confirmation'::public.booking_status THEN
    IF v_uid IS DISTINCT FROM v_traveler_id THEN
      RAISE EXCEPTION 'unauthorized';
    END IF;
  ELSE
    IF v_uid IS DISTINCT FROM v_guide_id THEN
      RAISE EXCEPTION 'unauthorized';
    END IF;
  END IF;

  UPDATE public.bookings
  SET status = p_to_status,
      updated_at = timezone('utc', now())
  WHERE id = p_booking_id
    AND status = v_from
  RETURNING status INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'concurrent_state_change';
  END IF;

  RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.transition_booking(uuid, public.booking_status) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transition_booking(uuid, public.booking_status) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Conditional traveler cancellation (#62)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cancel_booking_as_traveler(p_booking_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := (SELECT auth.uid()::uuid);
  v_traveler_id uuid;
  v_status public.booking_status;
  v_updated uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  PERFORM public.assert_active_account();

  SELECT traveler_id, status
  INTO v_traveler_id, v_status
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF v_traveler_id IS NULL THEN
    RAISE EXCEPTION 'booking_not_found';
  END IF;

  IF v_traveler_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  UPDATE public.bookings
  SET status = 'cancelled'::public.booking_status,
      updated_at = timezone('utc', now())
  WHERE id = p_booking_id
    AND traveler_id = v_uid
    AND status IN (
      'pending'::public.booking_status,
      'awaiting_guide_confirmation'::public.booking_status,
      'confirmed'::public.booking_status
    )
  RETURNING id INTO v_updated;

  IF v_updated IS NOT NULL THEN
    RETURN;
  END IF;

  IF v_status = 'completed'::public.booking_status THEN
    RAISE EXCEPTION 'concurrent_completion';
  END IF;

  RAISE EXCEPTION 'not_cancellable';
END;
$function$;

REVOKE ALL ON FUNCTION public.cancel_booking_as_traveler(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_booking_as_traveler(uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Payment agreement confirmation authority (#57)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.confirm_payment_agreement(p_booking_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := (SELECT auth.uid()::uuid);
  v_traveler_id uuid;
  v_guide_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  PERFORM public.assert_active_account();

  SELECT traveler_id, guide_id
  INTO v_traveler_id, v_guide_id
  FROM public.bookings
  WHERE id = p_booking_id;

  IF v_traveler_id IS NULL THEN
    RAISE EXCEPTION 'booking_not_found';
  END IF;

  IF v_uid = v_traveler_id THEN
    UPDATE public.payment_agreements
    SET traveler_confirmed_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
    WHERE booking_id = p_booking_id;
  ELSIF v_uid = v_guide_id THEN
    UPDATE public.payment_agreements
    SET guide_confirmed_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
    WHERE booking_id = p_booking_id;
  ELSE
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'agreement_not_found';
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.confirm_payment_agreement(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_payment_agreement(uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Q&A sender role derivation + atomic cap (#91)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.send_qa_message(
  p_thread_id uuid,
  p_sender_id uuid,
  p_sender_role public.message_sender_role,
  p_body text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_sender_id uuid := (SELECT auth.uid()::uuid);
  v_offer_id uuid;
  v_traveler_id uuid;
  v_guide_id uuid;
  v_sender_role public.message_sender_role;
  v_count integer;
BEGIN
  IF v_sender_id IS NULL OR p_sender_id IS DISTINCT FROM v_sender_id THEN
    RAISE EXCEPTION 'unauthorized_sender';
  END IF;

  PERFORM public.assert_active_account();

  SELECT ct.offer_id, tr.traveler_id, go.guide_id
  INTO v_offer_id, v_traveler_id, v_guide_id
  FROM public.conversation_threads ct
  JOIN public.guide_offers go ON go.id = ct.offer_id
  JOIN public.traveler_requests tr ON tr.id = go.request_id
  WHERE ct.id = p_thread_id
    AND ct.subject_type = 'offer'
    AND ct.offer_id IS NOT NULL
  FOR UPDATE OF ct;

  IF v_offer_id IS NULL OR NOT public.can_access_offer_thread(v_offer_id, v_sender_id) THEN
    RAISE EXCEPTION 'unauthorized_thread';
  END IF;

  IF v_sender_id = v_traveler_id THEN
    v_sender_role := 'traveler'::public.message_sender_role;
  ELSIF v_sender_id = v_guide_id THEN
    v_sender_role := 'guide'::public.message_sender_role;
  ELSE
    RAISE EXCEPTION 'unauthorized_sender';
  END IF;

  SELECT count(*)::integer
  INTO v_count
  FROM public.messages
  WHERE thread_id = p_thread_id;

  IF v_count >= 8 THEN
    RAISE EXCEPTION 'qa_thread_at_limit';
  END IF;

  INSERT INTO public.messages (thread_id, sender_id, sender_role, body)
  VALUES (p_thread_id, v_sender_id, v_sender_role, p_body);
END;
$function$;

-- ---------------------------------------------------------------------------
-- cancel_traveler_request: active-account gate (#87)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cancel_traveler_request(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := (SELECT auth.uid()::uuid);
  v_owner uuid;
  v_status public.request_status;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  PERFORM public.assert_active_account();

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

-- ---------------------------------------------------------------------------
-- Booking direct-write lockdown (#55, #56)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "bookings_insert" ON public.bookings;
CREATE POLICY "bookings_insert" ON public.bookings
  FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "bookings_update" ON public.bookings;
CREATE POLICY "bookings_update" ON public.bookings
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Payment agreement direct-write lockdown (#57)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "payment_agreements_insert" ON public.payment_agreements;
CREATE POLICY "payment_agreements_insert" ON public.payment_agreements
  FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "payment_agreements_update" ON public.payment_agreements;
CREATE POLICY "payment_agreements_update" ON public.payment_agreements
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Extended active-account write lockout (#87, #90)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE
  USING (
    (
      (SELECT auth.uid()) = id
      AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
    )
    OR public.is_admin()
  )
  WITH CHECK (
    (
      (
        (SELECT auth.uid()) = id
        AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
      )
      OR public.is_admin()
    )
    AND role = public.profile_role_for(id)
    AND account_status = public.profile_account_status_for(id)
  );

DROP POLICY IF EXISTS "guide_templates_insert_own" ON public.guide_templates;
CREATE POLICY "guide_templates_insert_own" ON public.guide_templates
  FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) = guide_id
    AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
  );

DROP POLICY IF EXISTS "guide_templates_update_own" ON public.guide_templates;
CREATE POLICY "guide_templates_update_own" ON public.guide_templates
  FOR UPDATE
  USING (
    (SELECT auth.uid()) = guide_id
    AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
  )
  WITH CHECK (
    (SELECT auth.uid()) = guide_id
    AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
  );

DROP POLICY IF EXISTS guide_templates_admin_all ON public.guide_templates;
CREATE POLICY guide_templates_admin_all ON public.guide_templates
  USING (
    public.is_admin()
    AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
  )
  WITH CHECK (
    public.is_admin()
    AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
  );

DROP POLICY IF EXISTS "moderation_cases_admin" ON public.moderation_cases;
CREATE POLICY "moderation_cases_admin" ON public.moderation_cases
  USING (
    public.is_admin()
    AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
  )
  WITH CHECK (
    public.is_admin()
    AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
  );

DROP POLICY IF EXISTS "moderation_actions_admin" ON public.moderation_actions;
CREATE POLICY "moderation_actions_admin" ON public.moderation_actions
  USING (
    public.is_admin()
    AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
  )
  WITH CHECK (
    public.is_admin()
    AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
  );

-- Listing child rows: active guide ownership required for direct writes.
DROP POLICY IF EXISTS "listing_days_insert" ON public.listing_days;
CREATE POLICY "listing_days_insert" ON public.listing_days
  FOR INSERT WITH CHECK (public.is_active_listing_owner(listing_id));

DROP POLICY IF EXISTS "listing_days_update" ON public.listing_days;
CREATE POLICY "listing_days_update" ON public.listing_days
  FOR UPDATE
  USING (public.is_active_listing_owner(listing_id))
  WITH CHECK (public.is_active_listing_owner(listing_id));

DROP POLICY IF EXISTS "listing_days_delete" ON public.listing_days;
CREATE POLICY "listing_days_delete" ON public.listing_days
  FOR DELETE USING (public.is_active_listing_owner(listing_id));

DROP POLICY IF EXISTS "listing_licenses_insert" ON public.listing_licenses;
CREATE POLICY "listing_licenses_insert" ON public.listing_licenses
  FOR INSERT WITH CHECK (public.is_active_listing_owner(listing_id));

DROP POLICY IF EXISTS "listing_licenses_delete" ON public.listing_licenses;
CREATE POLICY "listing_licenses_delete" ON public.listing_licenses
  FOR DELETE USING (public.is_active_listing_owner(listing_id));

DROP POLICY IF EXISTS "listing_meals_insert" ON public.listing_meals;
CREATE POLICY "listing_meals_insert" ON public.listing_meals
  FOR INSERT WITH CHECK (public.is_active_listing_owner(listing_id));

DROP POLICY IF EXISTS "listing_meals_update" ON public.listing_meals;
CREATE POLICY "listing_meals_update" ON public.listing_meals
  FOR UPDATE
  USING (public.is_active_listing_owner(listing_id))
  WITH CHECK (public.is_active_listing_owner(listing_id));

DROP POLICY IF EXISTS "listing_meals_delete" ON public.listing_meals;
CREATE POLICY "listing_meals_delete" ON public.listing_meals
  FOR DELETE USING (public.is_active_listing_owner(listing_id));

DROP POLICY IF EXISTS "listing_media_insert" ON public.listing_media;
CREATE POLICY "listing_media_insert" ON public.listing_media
  FOR INSERT WITH CHECK (public.is_active_listing_owner(listing_id));

DROP POLICY IF EXISTS "listing_media_update" ON public.listing_media;
CREATE POLICY "listing_media_update" ON public.listing_media
  FOR UPDATE
  USING (public.is_active_listing_owner(listing_id))
  WITH CHECK (public.is_active_listing_owner(listing_id));

DROP POLICY IF EXISTS "listing_photos_insert" ON public.listing_photos;
CREATE POLICY "listing_photos_insert" ON public.listing_photos
  FOR INSERT WITH CHECK (public.is_active_listing_owner(listing_id));

DROP POLICY IF EXISTS "listing_photos_update" ON public.listing_photos;
CREATE POLICY "listing_photos_update" ON public.listing_photos
  FOR UPDATE
  USING (public.is_active_listing_owner(listing_id))
  WITH CHECK (public.is_active_listing_owner(listing_id));

DROP POLICY IF EXISTS "listing_photos_delete" ON public.listing_photos;
CREATE POLICY "listing_photos_delete" ON public.listing_photos
  FOR DELETE USING (public.is_active_listing_owner(listing_id));

DROP POLICY IF EXISTS "listing_schedule_insert" ON public.listing_schedule;
CREATE POLICY "listing_schedule_insert" ON public.listing_schedule
  FOR INSERT WITH CHECK (public.is_active_listing_owner(listing_id));

DROP POLICY IF EXISTS "listing_schedule_update" ON public.listing_schedule;
CREATE POLICY "listing_schedule_update" ON public.listing_schedule
  FOR UPDATE
  USING (public.is_active_listing_owner(listing_id))
  WITH CHECK (public.is_active_listing_owner(listing_id));

DROP POLICY IF EXISTS "listing_schedule_delete" ON public.listing_schedule;
CREATE POLICY "listing_schedule_delete" ON public.listing_schedule
  FOR DELETE USING (public.is_active_listing_owner(listing_id));

DROP POLICY IF EXISTS "listing_schedule_extras_insert" ON public.listing_schedule_extras;
CREATE POLICY "listing_schedule_extras_insert" ON public.listing_schedule_extras
  FOR INSERT WITH CHECK (public.is_active_listing_owner(listing_id));

DROP POLICY IF EXISTS "listing_schedule_extras_update" ON public.listing_schedule_extras;
CREATE POLICY "listing_schedule_extras_update" ON public.listing_schedule_extras
  FOR UPDATE
  USING (public.is_active_listing_owner(listing_id))
  WITH CHECK (public.is_active_listing_owner(listing_id));

DROP POLICY IF EXISTS "listing_schedule_extras_delete" ON public.listing_schedule_extras;
CREATE POLICY "listing_schedule_extras_delete" ON public.listing_schedule_extras
  FOR DELETE USING (public.is_active_listing_owner(listing_id));

DROP POLICY IF EXISTS "listing_tariffs_insert" ON public.listing_tariffs;
CREATE POLICY "listing_tariffs_insert" ON public.listing_tariffs
  FOR INSERT WITH CHECK (public.is_active_listing_owner(listing_id));

DROP POLICY IF EXISTS "listing_tariffs_update" ON public.listing_tariffs;
CREATE POLICY "listing_tariffs_update" ON public.listing_tariffs
  FOR UPDATE
  USING (public.is_active_listing_owner(listing_id))
  WITH CHECK (public.is_active_listing_owner(listing_id));

DROP POLICY IF EXISTS "listing_tariffs_delete" ON public.listing_tariffs;
CREATE POLICY "listing_tariffs_delete" ON public.listing_tariffs
  FOR DELETE USING (public.is_active_listing_owner(listing_id));

DROP POLICY IF EXISTS "listing_tour_departures_insert" ON public.listing_tour_departures;
CREATE POLICY "listing_tour_departures_insert" ON public.listing_tour_departures
  FOR INSERT WITH CHECK (public.is_active_listing_owner(listing_id));

DROP POLICY IF EXISTS "listing_tour_departures_update" ON public.listing_tour_departures;
CREATE POLICY "listing_tour_departures_update" ON public.listing_tour_departures
  FOR UPDATE
  USING (public.is_active_listing_owner(listing_id))
  WITH CHECK (public.is_active_listing_owner(listing_id));

DROP POLICY IF EXISTS "listing_tour_departures_delete" ON public.listing_tour_departures;
CREATE POLICY "listing_tour_departures_delete" ON public.listing_tour_departures
  FOR DELETE USING (public.is_active_listing_owner(listing_id));

DROP POLICY IF EXISTS "listing_videos_insert" ON public.listing_videos;
CREATE POLICY "listing_videos_insert" ON public.listing_videos
  FOR INSERT WITH CHECK (public.is_active_listing_owner(listing_id));

DROP POLICY IF EXISTS "listing_videos_update" ON public.listing_videos;
CREATE POLICY "listing_videos_update" ON public.listing_videos
  FOR UPDATE
  USING (public.is_active_listing_owner(listing_id))
  WITH CHECK (public.is_active_listing_owner(listing_id));

DROP POLICY IF EXISTS "listing_videos_delete" ON public.listing_videos;
CREATE POLICY "listing_videos_delete" ON public.listing_videos
  FOR DELETE USING (public.is_active_listing_owner(listing_id));
