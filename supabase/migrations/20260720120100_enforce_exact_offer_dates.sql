-- Exact traveler dates are an invariant, not an action-layer preference: direct
-- PostgREST writes (including admin writes) must obey the same Moscow-date rule.
CREATE OR REPLACE FUNCTION public.enforce_exact_offer_start_date()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.traveler_requests request
    WHERE request.id = NEW.request_id
      AND request.date_flexibility = 'exact'
      AND (
        NEW.starts_at IS NULL
        OR (NEW.starts_at AT TIME ZONE 'Europe/Moscow')::date <> request.starts_on
      )
  ) THEN
    RAISE EXCEPTION 'offer_start_date_must_match_exact_request'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_exact_offer_start_date ON public.guide_offers;
CREATE TRIGGER enforce_exact_offer_start_date
  BEFORE INSERT OR UPDATE OF starts_at, ends_at, request_id ON public.guide_offers
  FOR EACH ROW EXECUTE FUNCTION public.enforce_exact_offer_start_date();
