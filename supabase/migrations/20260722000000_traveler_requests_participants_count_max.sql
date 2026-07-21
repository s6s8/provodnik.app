-- D21-2: one traveler request carries at most 50 travelers. The app-layer zod
-- schemas already enforce it, but travelers hold a JWT and can write
-- traveler_requests straight through PostgREST, so the ceiling has to live in
-- the database too. Mirrors MAX_REQUEST_PARTICIPANTS in
-- src/data/traveler-request/schema.ts.
--
-- NOT VALID: legacy rows above the ceiling (the app allowed no upper bound at
-- the DB level until now) stay readable and editable; only new/updated values
-- are checked.
ALTER TABLE public.traveler_requests
  DROP CONSTRAINT IF EXISTS traveler_requests_participants_count_max;

ALTER TABLE public.traveler_requests
  ADD CONSTRAINT traveler_requests_participants_count_max
  CHECK (participants_count <= 50) NOT VALID;
