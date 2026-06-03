-- Tighten audited over-broad write paths without editing historical migrations.

DROP POLICY IF EXISTS "marketplace_events_insert" ON public.marketplace_events;
CREATE POLICY "marketplace_events_insert"
  ON public.marketplace_events
  FOR INSERT
  WITH CHECK (public.is_admin());

DROP FUNCTION IF EXISTS public.record_marketplace_event(
  public.event_scope,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  jsonb
);
CREATE FUNCTION public.record_marketplace_event(
  p_scope public.event_scope,
  p_request_id uuid DEFAULT NULL,
  p_booking_id uuid DEFAULT NULL,
  p_dispute_id uuid DEFAULT NULL,
  p_event_type text DEFAULT NULL,
  p_summary text DEFAULT NULL,
  p_detail text DEFAULT NULL,
  p_payload jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := (SELECT auth.uid()::uuid);
  v_event_id uuid;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
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

REVOKE ALL ON FUNCTION public.record_marketplace_event(
  public.event_scope,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  jsonb
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_marketplace_event(
  public.event_scope,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  jsonb
) TO authenticated;

DROP TRIGGER IF EXISTS tg_guard_traveler_offer_update ON public.guide_offers;
DROP FUNCTION IF EXISTS public.guard_traveler_offer_update();
CREATE FUNCTION public.guard_traveler_offer_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid := (SELECT auth.uid()::uuid);
  v_is_request_owner boolean;
BEGIN
  IF v_actor_id IS NULL OR public.is_admin() OR OLD.guide_id = v_actor_id THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.traveler_requests tr
    WHERE tr.id = OLD.request_id
      AND tr.traveler_id = v_actor_id
  )
  INTO v_is_request_owner;

  IF NOT v_is_request_owner THEN
    RETURN NEW;
  END IF;

  IF OLD.request_id IS DISTINCT FROM NEW.request_id
    OR OLD.guide_id IS DISTINCT FROM NEW.guide_id
    OR OLD.listing_id IS DISTINCT FROM NEW.listing_id
    OR OLD.title IS DISTINCT FROM NEW.title
    OR OLD.message IS DISTINCT FROM NEW.message
    OR OLD.price_minor IS DISTINCT FROM NEW.price_minor
    OR OLD.currency IS DISTINCT FROM NEW.currency
    OR OLD.capacity IS DISTINCT FROM NEW.capacity
    OR OLD.starts_at IS DISTINCT FROM NEW.starts_at
    OR OLD.ends_at IS DISTINCT FROM NEW.ends_at
    OR OLD.inclusions IS DISTINCT FROM NEW.inclusions
    OR OLD.expires_at IS DISTINCT FROM NEW.expires_at
    OR OLD.route_stops IS DISTINCT FROM NEW.route_stops
    OR OLD.route_duration_minutes IS DISTINCT FROM NEW.route_duration_minutes
  THEN
    RAISE EXCEPTION 'traveler_offer_update_forbidden';
  END IF;

  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  IF NOT (
    OLD.status = 'pending'::public.offer_status
    AND NEW.status IN (
      'accepted'::public.offer_status,
      'declined'::public.offer_status,
      'counter_offered'::public.offer_status
    )
  ) THEN
    RAISE EXCEPTION 'traveler_offer_transition_forbidden';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_guard_traveler_offer_update
  BEFORE UPDATE ON public.guide_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_traveler_offer_update();

DROP POLICY IF EXISTS "bonus_ledger_insert" ON public.bonus_ledger;
CREATE POLICY "bonus_ledger_insert"
  ON public.bonus_ledger
  FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR (
      (SELECT auth.uid()) = user_id
      AND reason = 'referral_redeemed'
      AND ref_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.referral_redemptions rr
        WHERE rr.code_id = ref_id
          AND rr.redeemed_by = (SELECT auth.uid())
      )
    )
    OR (
      (SELECT auth.uid()) = user_id
      AND reason = 'referral_used'
      AND ref_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.referral_codes rc
        WHERE rc.id = ref_id
          AND rc.user_id = (SELECT auth.uid())
      )
      AND EXISTS (
        SELECT 1
        FROM public.referral_redemptions rr
        WHERE rr.code_id = ref_id
      )
    )
  );

DROP POLICY IF EXISTS "review_ratings_breakdown_insert" ON public.review_ratings_breakdown;
CREATE POLICY "review_ratings_breakdown_insert"
  ON public.review_ratings_breakdown
  FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.reviews r
      WHERE r.id = review_id
        AND r.status = 'published'::public.review_status
        AND r.traveler_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "guide_licenses_update" ON public.guide_licenses;
CREATE POLICY "guide_licenses_update"
  ON public.guide_licenses
  FOR UPDATE
  USING (guide_id = (SELECT auth.uid()) OR public.is_admin())
  WITH CHECK (guide_id = (SELECT auth.uid()) OR public.is_admin());
