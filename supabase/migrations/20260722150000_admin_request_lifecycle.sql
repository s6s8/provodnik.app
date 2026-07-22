-- #53: Admin-only request lifecycle — block, unblock, safe deletion.
-- Database-enforced discoverability and write rejection; admin RPCs are the sole
-- mutation authority (no direct PostgREST patches on moderation columns).

ALTER TABLE public.traveler_requests
  ADD COLUMN IF NOT EXISTS admin_blocked_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_blocked_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS admin_block_reason text,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS admin_delete_reason text;

COMMENT ON COLUMN public.traveler_requests.admin_blocked_at IS
  'When set, the request is hidden from public/guide/traveler discovery and rejects new offers/joins. Only admins read moderated rows.';
COMMENT ON COLUMN public.traveler_requests.deleted_at IS
  'Soft-delete marker: row and linked bookings remain for audit; request is hidden from discovery and rejects new offers/joins.';

-- Lifecycle columns are writable only from admin_* RPCs (session flag), never from PostgREST PATCH.
CREATE OR REPLACE FUNCTION public.fn_guard_traveler_request_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF (
    NEW.admin_blocked_at IS DISTINCT FROM OLD.admin_blocked_at
    OR NEW.admin_blocked_by IS DISTINCT FROM OLD.admin_blocked_by
    OR NEW.admin_block_reason IS DISTINCT FROM OLD.admin_block_reason
    OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
    OR NEW.deleted_by IS DISTINCT FROM OLD.deleted_by
    OR NEW.admin_delete_reason IS DISTINCT FROM OLD.admin_delete_reason
  )
  AND coalesce(current_setting('app.admin_request_lifecycle_write', true), '') <> '1' THEN
    RAISE EXCEPTION 'request_lifecycle_not_editable' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_guard_traveler_request_lifecycle ON public.traveler_requests;
CREATE TRIGGER trg_guard_traveler_request_lifecycle
  BEFORE UPDATE ON public.traveler_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_guard_traveler_request_lifecycle();

CREATE OR REPLACE FUNCTION public.request_is_discoverable(p_request_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.traveler_requests tr
    WHERE tr.id = p_request_id
      AND tr.admin_blocked_at IS NULL
      AND tr.deleted_at IS NULL
      AND tr.status = 'open'::public.request_status
  );
$$;

REVOKE ALL ON FUNCTION public.request_is_discoverable(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_is_discoverable(uuid) TO authenticated, service_role;

-- Public discovery projection: only open, non-directed, non-moderated requests.
CREATE OR REPLACE VIEW public.v_public_open_requests AS
  SELECT id,
         destination,
         region,
         interests,
         starts_on,
         ends_on,
         start_time,
         end_time,
         budget_minor,
         currency,
         participants_count,
         format_preference,
         NULL::text AS notes,
         open_to_join,
         group_capacity,
         status,
         created_at,
         date_flexibility,
         date_locked,
         time_locked,
         requested_languages
    FROM public.traveler_requests tr
   WHERE status = 'open'::public.request_status
     AND target_guide_id IS NULL
     AND admin_blocked_at IS NULL
     AND deleted_at IS NULL;

-- Tighten direct reads: owners/guides/travelers never see moderated rows; admins retain full access.
DROP POLICY IF EXISTS traveler_requests_select ON public.traveler_requests;
CREATE POLICY traveler_requests_select ON public.traveler_requests FOR SELECT USING (
  (
    (SELECT auth.uid()) = traveler_id
    AND admin_blocked_at IS NULL
    AND deleted_at IS NULL
  )
  OR is_admin()
  OR (
    target_guide_id IS NOT NULL
    AND (SELECT auth.uid()) = target_guide_id
    AND admin_blocked_at IS NULL
    AND deleted_at IS NULL
  )
  OR (
    (SELECT auth.uid()) IS NOT NULL
    AND status = 'open'::public.request_status
    AND admin_blocked_at IS NULL
    AND deleted_at IS NULL
  )
);

-- Owners may edit only non-moderated requests; lifecycle columns stay RPC-only via the trigger above.
DROP POLICY IF EXISTS "traveler_requests_update" ON public.traveler_requests;
CREATE POLICY "traveler_requests_update" ON public.traveler_requests
  FOR UPDATE
  USING (
    (
      (SELECT auth.uid()) = traveler_id
      AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
      AND admin_blocked_at IS NULL
      AND deleted_at IS NULL
    )
    OR public.is_admin()
  )
  WITH CHECK (
    (
      (SELECT auth.uid()) = traveler_id
      AND public.profile_account_status_for((SELECT auth.uid())) = 'active'::public.account_status
      AND admin_blocked_at IS NULL
      AND deleted_at IS NULL
    )
    OR public.is_admin()
  );

-- Reject offers on moderated requests (admin bypass retained).
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
          AND tr.admin_blocked_at IS NULL
          AND tr.deleted_at IS NULL
          AND (tr.target_guide_id IS NULL OR tr.target_guide_id = (SELECT auth.uid()))
      )
    )
    OR public.is_admin()
  );

-- Guides cannot mutate offers on admin-blocked or soft-deleted requests (admin bypass retained).
DROP POLICY IF EXISTS guide_offers_update ON public.guide_offers;
CREATE POLICY guide_offers_update
  ON public.guide_offers
  FOR UPDATE
  USING (
    (
      ((SELECT auth.uid()) = guide_id)
      AND (public.profile_account_status_for(guide_id) = 'active'::public.account_status)
      AND EXISTS (
        SELECT 1 FROM public.traveler_requests tr
        WHERE tr.id = guide_offers.request_id
          AND tr.admin_blocked_at IS NULL
          AND tr.deleted_at IS NULL
      )
    )
    OR public.is_admin()
  )
  WITH CHECK (
    (
      ((SELECT auth.uid()) = guide_id)
      AND (public.profile_account_status_for(guide_id) = 'active'::public.account_status)
      AND EXISTS (
        SELECT 1 FROM public.traveler_requests tr
        WHERE tr.id = guide_offers.request_id
          AND tr.admin_blocked_at IS NULL
          AND tr.deleted_at IS NULL
      )
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS open_request_members_insert ON public.open_request_members;
CREATE POLICY open_request_members_insert
  ON public.open_request_members
  FOR INSERT
  WITH CHECK (
    (
      ((SELECT auth.uid()) = traveler_id)
      AND (public.profile_account_status_for(traveler_id) = 'active'::public.account_status)
      AND EXISTS (
        SELECT 1 FROM public.traveler_requests tr
        WHERE tr.id = open_request_members.request_id
          AND tr.target_guide_id IS NULL
          AND tr.admin_blocked_at IS NULL
          AND tr.deleted_at IS NULL
      )
    )
    OR public.is_admin()
  );

-- accept_offer must not book a moderated request.
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

  IF EXISTS (
    SELECT 1 FROM public.traveler_requests
    WHERE id = v_request_id
      AND (admin_blocked_at IS NOT NULL OR deleted_at IS NOT NULL)
  ) THEN
    RAISE EXCEPTION 'request_unavailable';
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

CREATE OR REPLACE FUNCTION public.admin_block_traveler_request(
  p_request_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
DECLARE
  v_admin_id uuid := (SELECT auth.uid()::uuid);
  v_status public.request_status;
BEGIN
  IF v_admin_id IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT status INTO v_status
  FROM public.traveler_requests
  WHERE id = p_request_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'request_not_found';
  END IF;

  IF v_status <> 'open'::public.request_status THEN
    RAISE EXCEPTION 'not_blockable';
  END IF;

  PERFORM set_config('app.admin_request_lifecycle_write', '1', true);

  UPDATE public.traveler_requests
  SET admin_blocked_at = NOW(),
      admin_blocked_by = v_admin_id,
      admin_block_reason = NULLIF(trim(p_reason), ''),
      updated_at = NOW()
  WHERE id = p_request_id
    AND admin_blocked_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'already_blocked';
  END IF;

  UPDATE public.guide_offers
  SET status = 'declined', updated_at = NOW()
  WHERE request_id = p_request_id
    AND status = 'pending'::public.offer_status;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_unblock_traveler_request(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
DECLARE
  v_admin_id uuid := (SELECT auth.uid()::uuid);
  v_status public.request_status;
BEGIN
  IF v_admin_id IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT status INTO v_status
  FROM public.traveler_requests
  WHERE id = p_request_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'request_not_found';
  END IF;

  IF v_status <> 'open'::public.request_status THEN
    RAISE EXCEPTION 'not_unblockable';
  END IF;

  PERFORM set_config('app.admin_request_lifecycle_write', '1', true);

  UPDATE public.traveler_requests
  SET admin_blocked_at = NULL,
      admin_blocked_by = NULL,
      admin_block_reason = NULL,
      updated_at = NOW()
  WHERE id = p_request_id
    AND admin_blocked_at IS NOT NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_blocked';
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_delete_traveler_request(
  p_request_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
DECLARE
  v_admin_id uuid := (SELECT auth.uid()::uuid);
BEGIN
  IF v_admin_id IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  PERFORM 1
  FROM public.traveler_requests
  WHERE id = p_request_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'request_not_found';
  END IF;

  PERFORM set_config('app.admin_request_lifecycle_write', '1', true);

  UPDATE public.traveler_requests
  SET deleted_at = NOW(),
      deleted_by = v_admin_id,
      admin_delete_reason = NULLIF(trim(p_reason), ''),
      updated_at = NOW()
  WHERE id = p_request_id;

  UPDATE public.guide_offers
  SET status = 'declined', updated_at = NOW()
  WHERE request_id = p_request_id
    AND status IN (
      'pending'::public.offer_status,
      'counter_offered'::public.offer_status
    );
END;
$function$;

-- counter_offer: reject moderated requests before mutating offers (body from 20260722000500).
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
  v_admin_blocked_at TIMESTAMPTZ;
  v_deleted_at TIMESTAMPTZ;
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
    go.route_duration_minutes,
    tr.admin_blocked_at,
    tr.deleted_at
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
    v_route_duration_minutes,
    v_admin_blocked_at,
    v_deleted_at
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

  IF v_admin_blocked_at IS NOT NULL OR v_deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'request_unavailable';
  END IF;

  IF v_status IS DISTINCT FROM 'pending'::public.offer_status THEN
    RAISE EXCEPTION 'offer_not_pending';
  END IF;

  IF v_expires_at IS NOT NULL AND v_expires_at <= now() THEN
    RAISE EXCEPTION 'offer_expired';
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

REVOKE ALL ON FUNCTION public.admin_block_traveler_request(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_unblock_traveler_request(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_delete_traveler_request(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_block_traveler_request(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_unblock_traveler_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_traveler_request(uuid, text) TO authenticated;
