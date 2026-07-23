-- Offer expiry: normalize date-only UTC midnight to end-of-Moscow-day at the DB boundary.
--
-- createOfferInputSchema already normalizes YYYY-MM-DD before writes, but direct
-- PostgREST inserts can still land expires_at at UTC midnight (= 03:00 MSK), which
-- kills the offer 21 hours early. Mirror lib/dates.normalizeExpiryInput here so
-- every writer stores the same instant.

CREATE OR REPLACE FUNCTION public.normalize_offer_expires_at(p_expires_at timestamptz)
RETURNS timestamptz
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT CASE
    WHEN p_expires_at IS NULL THEN NULL
    -- JS `new Date('YYYY-MM-DD')` and naive date-only payloads arrive as UTC midnight.
    WHEN (p_expires_at AT TIME ZONE 'UTC')::time = time '00:00:00'
      AND EXTRACT(MILLISECONDS FROM (p_expires_at AT TIME ZONE 'UTC')) = 0
    THEN (
      ((p_expires_at AT TIME ZONE 'UTC')::date::text || ' 23:59:59.999')::timestamp
      AT TIME ZONE 'Europe/Moscow'
    )
    ELSE p_expires_at
  END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_live_offer_expiry()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  NEW.expires_at := public.normalize_offer_expires_at(NEW.expires_at);

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
