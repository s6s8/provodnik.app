-- Wave 1 (#64, #80-84, #88, #89, #92) — request privacy and public-data authority.
--
-- Closes remaining client-held authority gaps:
--   1. Thread access helpers bind to auth.uid(); optional target_user_id is ignored.
--   2. Addressed guides inherit request-thread access on directed requests.
--   3. Social-proof RPC returns only discoverable assembly requests.
--   4. Marketplace events require an authenticated actor related to the resource.
--   5. Non-open requests reject new offers and accept_offer transitions.
--   6. Fresh environments restore hourly request expiry (ADR-020).

-- ---------------------------------------------------------------------------
-- 1. Thread access: always evaluate the session identity.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.can_access_request_thread(
  target_request_id uuid,
  target_user_id uuid DEFAULT NULL::uuid
) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT (SELECT auth.uid()::uuid) IS NOT NULL
    AND EXISTS (
      SELECT 1
        FROM public.traveler_requests tr
       WHERE tr.id = target_request_id
         AND (
           tr.traveler_id = (SELECT auth.uid()::uuid)
           OR tr.target_guide_id = (SELECT auth.uid()::uuid)
           OR public.user_has_role((SELECT auth.uid()::uuid), 'admin'::public.app_role)
           OR EXISTS (
             SELECT 1
               FROM public.guide_offers go
              WHERE go.request_id = tr.id
                AND go.guide_id = (SELECT auth.uid()::uuid)
           )
           OR EXISTS (
             SELECT 1
               FROM public.request_views rv
              WHERE rv.request_id = tr.id
                AND rv.guide_id = (SELECT auth.uid()::uuid)
           )
           OR EXISTS (
             SELECT 1
               FROM public.open_request_members m
              WHERE m.request_id = tr.id
                AND m.traveler_id = (SELECT auth.uid()::uuid)
                AND m.status = 'joined'::public.member_status
           )
         )
    );
$$;

CREATE OR REPLACE FUNCTION public.can_access_offer_thread(
  target_offer_id uuid,
  target_user_id uuid DEFAULT NULL::uuid
) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT (SELECT auth.uid()::uuid) IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.guide_offers go
      JOIN public.traveler_requests tr ON tr.id = go.request_id
      WHERE go.id = target_offer_id
        AND (
          go.guide_id = (SELECT auth.uid()::uuid)
          OR tr.traveler_id = (SELECT auth.uid()::uuid)
          OR public.user_has_role((SELECT auth.uid()::uuid), 'admin'::public.app_role)
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.can_access_booking_thread(
  target_booking_id uuid,
  target_user_id uuid DEFAULT NULL::uuid
) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT (SELECT auth.uid()::uuid) IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = target_booking_id
        AND (
          b.traveler_id = (SELECT auth.uid()::uuid)
          OR b.guide_id = (SELECT auth.uid()::uuid)
          OR public.user_has_role((SELECT auth.uid()::uuid), 'admin'::public.app_role)
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.can_access_dispute_thread(
  target_dispute_id uuid,
  target_user_id uuid DEFAULT NULL::uuid
) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT (SELECT auth.uid()::uuid) IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.disputes d
      JOIN public.bookings b ON b.id = d.booking_id
      WHERE d.id = target_dispute_id
        AND (
          d.opened_by = (SELECT auth.uid()::uuid)
          OR d.assigned_admin_id = (SELECT auth.uid()::uuid)
          OR b.traveler_id = (SELECT auth.uid()::uuid)
          OR b.guide_id = (SELECT auth.uid()::uuid)
          OR public.user_has_role((SELECT auth.uid()::uuid), 'admin'::public.app_role)
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.can_access_conversation_thread(
  target_thread_id uuid,
  target_user_id uuid DEFAULT NULL::uuid
) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT (SELECT auth.uid()::uuid) IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.conversation_threads ct
      WHERE ct.id = target_thread_id
        AND (
          ct.created_by = (SELECT auth.uid()::uuid)
          OR CASE ct.subject_type
            WHEN 'request' THEN public.can_access_request_thread(ct.request_id)
            WHEN 'offer'   THEN public.can_access_offer_thread(ct.offer_id)
            WHEN 'booking' THEN public.can_access_booking_thread(ct.booking_id)
            WHEN 'dispute' THEN public.can_access_dispute_thread(ct.dispute_id)
            ELSE false
          END
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.can_create_conversation_thread(
  target_subject_type public.thread_subject,
  target_request_id uuid,
  target_offer_id uuid,
  target_booking_id uuid,
  target_dispute_id uuid,
  target_user_id uuid DEFAULT NULL::uuid
) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT (SELECT auth.uid()::uuid) IS NOT NULL
    AND CASE target_subject_type
      WHEN 'request' THEN public.can_access_request_thread(target_request_id)
      WHEN 'offer'   THEN public.can_access_offer_thread(target_offer_id)
      WHEN 'booking' THEN public.can_access_booking_thread(target_booking_id)
      WHEN 'dispute' THEN public.can_access_dispute_thread(target_dispute_id)
      ELSE false
    END;
$$;

COMMENT ON FUNCTION public.can_access_request_thread(uuid, uuid) IS
  'Request-thread read/create authority for the authenticated session only. target_user_id is retained for signature compatibility and is intentionally ignored.';
COMMENT ON FUNCTION public.can_access_conversation_thread(uuid, uuid) IS
  'Conversation-thread read authority for the authenticated session only. target_user_id is retained for signature compatibility and is intentionally ignored.';

-- ---------------------------------------------------------------------------
-- 2. Social proof: only genuinely discoverable assembly requests.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_bidding_guides_for_request(p_request_id uuid)
RETURNS TABLE(
  user_id uuid,
  full_name text,
  avatar_url text,
  average_rating numeric,
  review_count integer,
  slug text
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT ON (gp.user_id)
    gp.user_id, p.full_name, p.avatar_url, gp.average_rating, gp.review_count, gp.slug
  FROM public.guide_offers o
  JOIN public.guide_profiles gp ON gp.user_id = o.guide_id
  LEFT JOIN public.profiles p ON p.id = gp.user_id
  JOIN public.traveler_requests tr ON tr.id = o.request_id
  WHERE o.request_id = p_request_id
    AND public.request_is_discoverable(p_request_id)
    AND tr.open_to_join = true
    AND o.status = 'pending'::public.offer_status
    AND gp.verification_status = 'approved'
  ORDER BY gp.user_id, gp.average_rating DESC NULLS LAST;
$$;

-- ---------------------------------------------------------------------------
-- 3. Marketplace events: related authenticated actors only.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.actor_may_record_marketplace_event(
  p_scope public.event_scope,
  p_request_id uuid,
  p_booking_id uuid,
  p_dispute_id uuid,
  p_actor_id uuid
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN p_actor_id IS NULL THEN false
    WHEN public.is_admin() THEN true
    WHEN p_scope = 'request'::public.event_scope AND p_request_id IS NOT NULL THEN EXISTS (
      SELECT 1
      FROM public.traveler_requests tr
      WHERE tr.id = p_request_id
        AND (
          tr.traveler_id = p_actor_id
          OR tr.target_guide_id = p_actor_id
          OR EXISTS (
            SELECT 1
            FROM public.guide_offers go
            WHERE go.request_id = tr.id
              AND go.guide_id = p_actor_id
          )
          OR EXISTS (
            SELECT 1
            FROM public.open_request_members m
            WHERE m.request_id = tr.id
              AND m.traveler_id = p_actor_id
              AND m.status = 'joined'::public.member_status
          )
        )
    )
    WHEN p_scope = 'booking'::public.event_scope AND p_booking_id IS NOT NULL THEN EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.id = p_booking_id
        AND (b.traveler_id = p_actor_id OR b.guide_id = p_actor_id)
    )
    WHEN p_scope = 'dispute'::public.event_scope AND p_dispute_id IS NOT NULL THEN EXISTS (
      SELECT 1
      FROM public.disputes d
      JOIN public.bookings b ON b.id = d.booking_id
      WHERE d.id = p_dispute_id
        AND (
          d.opened_by = p_actor_id
          OR b.traveler_id = p_actor_id
          OR b.guide_id = p_actor_id
        )
    )
    WHEN p_scope = 'moderation'::public.event_scope THEN public.is_admin()
    ELSE false
  END;
$$;

REVOKE ALL ON FUNCTION public.actor_may_record_marketplace_event(public.event_scope, uuid, uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.actor_may_record_marketplace_event(public.event_scope, uuid, uuid, uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.record_marketplace_event(
  p_scope public.event_scope,
  p_request_id uuid DEFAULT NULL::uuid,
  p_booking_id uuid DEFAULT NULL::uuid,
  p_dispute_id uuid DEFAULT NULL::uuid,
  p_event_type text DEFAULT NULL::text,
  p_summary text DEFAULT NULL::text,
  p_detail text DEFAULT NULL::text,
  p_payload jsonb DEFAULT NULL::jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_actor_id uuid := (SELECT auth.uid()::uuid);
  v_event_id uuid;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  IF NOT public.actor_may_record_marketplace_event(
    p_scope, p_request_id, p_booking_id, p_dispute_id, v_actor_id
  ) THEN
    RAISE EXCEPTION 'unauthorized_event_actor';
  END IF;

  INSERT INTO public.marketplace_events (
    scope,
    request_id,
    booking_id,
    dispute_id,
    actor_id,
    event_type,
    summary,
    detail,
    payload
  )
  VALUES (
    p_scope,
    p_request_id,
    p_booking_id,
    p_dispute_id,
    v_actor_id,
    p_event_type,
    p_summary,
    p_detail,
    COALESCE(p_payload, '{}'::jsonb)
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Offer lifecycle: only open requests accept new bids or acceptance.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS guide_offers_insert ON public.guide_offers;
CREATE POLICY guide_offers_insert
  ON public.guide_offers
  FOR INSERT
  WITH CHECK (
    (
      ((SELECT auth.uid()) = guide_id)
      AND (public.profile_account_status_for(guide_id) = 'active'::public.account_status)
      AND EXISTS (
        SELECT 1 FROM public.guide_profiles gp
        WHERE gp.user_id = guide_offers.guide_id
          AND gp.verification_status = 'approved'::public.guide_verification_status
          AND gp.is_available = true
      )
      AND (NOT public.guide_interval_blocked(guide_id, starts_at, ends_at))
      AND EXISTS (
        SELECT 1 FROM public.traveler_requests tr
        WHERE tr.id = guide_offers.request_id
          AND tr.status = 'open'::public.request_status
          AND tr.admin_blocked_at IS NULL
          AND tr.deleted_at IS NULL
          AND (tr.target_guide_id IS NULL OR tr.target_guide_id = (SELECT auth.uid()))
      )
    )
    OR public.is_admin()
  );

CREATE OR REPLACE FUNCTION public.accept_offer(p_offer_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_traveler_id UUID := (SELECT auth.uid()::uuid);
  v_request_id  UUID;
  v_request_status public.request_status;
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

  SELECT go.request_id, go.guide_id, go.price_minor, go.currency, go.starts_at, go.expires_at, tr.status
  INTO v_request_id, v_guide_id, v_price_minor, v_currency, v_starts_at, v_expires_at, v_request_status
  FROM public.guide_offers go
  JOIN public.traveler_requests tr ON tr.id = go.request_id
  WHERE go.id = p_offer_id
    AND go.status = 'pending'
  FOR UPDATE OF go;

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

  IF EXISTS (
    SELECT 1 FROM public.traveler_requests
    WHERE id = v_request_id
      AND (admin_blocked_at IS NOT NULL OR deleted_at IS NOT NULL)
  ) THEN
    RAISE EXCEPTION 'request_unavailable';
  END IF;

  IF v_request_status IS DISTINCT FROM 'open'::public.request_status THEN
    RAISE EXCEPTION 'request_not_open';
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

  INSERT INTO public.payment_agreements (booking_id, agreed_total_minor, currency, method)
  VALUES (v_booking_id, v_price_minor, COALESCE(v_currency, 'RUB'), 'in_person');

  INSERT INTO public.conversation_threads (subject_type, booking_id, created_by)
  VALUES ('booking', v_booking_id, v_traveler_id)
  RETURNING id INTO v_thread_id;

  RETURN v_booking_id;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 5. Request expiry cron (ADR-020).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.expire_open_traveler_requests()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.traveler_requests
     SET status = 'expired'::public.request_status,
         updated_at = timezone('utc', now())
   WHERE status = 'open'::public.request_status
     AND starts_on < CURRENT_DATE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_open_traveler_requests() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_open_traveler_requests() TO service_role;

-- One-time backfill runs unconditionally; cron scheduling is best-effort so a
-- pg_cron hiccup cannot roll back the security fixes above (ADR-020).
SELECT public.expire_open_traveler_requests();

DO $cron$
DECLARE
  v_job record;
BEGIN
  IF to_regclass('cron.job') IS NULL THEN
    RAISE WARNING 'pg_cron unavailable; expire_open_traveler_requests() exists but hourly schedule was skipped';
    RETURN;
  END IF;

  FOR v_job IN SELECT jobid FROM cron.job WHERE jobname = 'expire-open-requests' LOOP
    PERFORM cron.unschedule(v_job.jobid);
  END LOOP;

  PERFORM cron.schedule(
    'expire-open-requests',
    '0 * * * *',
    $$SELECT public.expire_open_traveler_requests();$$
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'expire-open-requests cron schedule skipped: %', SQLERRM;
END
$cron$;
