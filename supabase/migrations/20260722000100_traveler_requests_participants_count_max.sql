-- D21-2: one traveler request carries at most 50 travelers. The app-layer zod
-- schemas already enforce it, but travelers hold a JWT and can write
-- traveler_requests straight through PostgREST, so the ceiling has to live in
-- the database too. Mirrors MAX_REQUEST_PARTICIPANTS in
-- src/data/traveler-request/schema.ts.
--
-- A CHECK constraint — even NOT VALID — is re-checked on every UPDATE of a row,
-- so it would block unrelated edits to pre-existing rows above the ceiling. A
-- trigger is the legacy-safe boundary: it rejects new rows above 50 and any
-- update that actually moves participants_count above 50, while leaving other
-- edits to legacy >50 rows alone. The lower bound stays where it is, on the
-- existing traveler_requests_participants_count_check constraint.
ALTER TABLE public.traveler_requests
  DROP CONSTRAINT IF EXISTS traveler_requests_participants_count_max;

CREATE OR REPLACE FUNCTION public.enforce_traveler_request_participants_max()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF NEW.participants_count > 50
     AND (TG_OP = 'INSERT' OR NEW.participants_count IS DISTINCT FROM OLD.participants_count)
  THEN
    RAISE EXCEPTION 'participants_count_above_max'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_traveler_request_participants_max ON public.traveler_requests;
CREATE TRIGGER enforce_traveler_request_participants_max
  BEFORE INSERT OR UPDATE OF participants_count ON public.traveler_requests
  FOR EACH ROW EXECUTE FUNCTION public.enforce_traveler_request_participants_max();
