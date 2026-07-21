-- Offer expiry is an invariant, not an action-layer preference.
--
-- Two holes closed here:
--   1. Nothing at the DB boundary stopped a pending offer from being written with an
--      expiry at or before now(). Zod guarded the two server actions; a direct
--      PostgREST write (or any future writer) produced an offer that is born dead —
--      accept_offer immediately raises 'offer_expired' on it.
--   2. counter_offer copied the source offer's expires_at into the replacement without
--      checking it, so countering an expired offer minted a fresh 'pending' row that
--      inherited the elapsed timestamp — permanently unacceptable, and it consumed the
--      one-active-offer-per-guide slot.
--
-- Legacy rows are preserved: the trigger only judges an offer when the expiry is being
-- written or when a row becomes pending. Existing expired-but-pending rows can still be
-- declined, withdrawn, accepted-into-failure and marked read exactly as before.
--
-- Rollback: DROP TRIGGER enforce_live_offer_expiry ON public.guide_offers; and re-apply
-- the counter_offer body from 20260706120000_enforce_active_account_write_rpcs.sql.

CREATE OR REPLACE FUNCTION public.enforce_live_offer_expiry()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  -- Untouched expiry on an already-pending row: legacy data stays writable.
  IF TG_OP = 'UPDATE'
     AND NEW.expires_at IS NOT DISTINCT FROM OLD.expires_at
     AND OLD.status = 'pending'::public.offer_status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'pending'::public.offer_status
     AND NEW.expires_at IS NOT NULL
     AND NEW.expires_at <= now() THEN
    RAISE EXCEPTION 'offer_expiry_must_be_in_future'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_live_offer_expiry ON public.guide_offers;
CREATE TRIGGER enforce_live_offer_expiry
  BEFORE INSERT OR UPDATE OF expires_at, status ON public.guide_offers
  FOR EACH ROW EXECUTE FUNCTION public.enforce_live_offer_expiry();


-- counter_offer: reject an expired source offer up front, so no replacement can inherit
-- an elapsed expiry. Same 'offer_expired' vocabulary accept_offer already raises.
-- Body is otherwise unchanged from 20260706120000_enforce_active_account_write_rpcs.sql.
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
