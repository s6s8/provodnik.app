-- Add traveler_read_at to guide_offers so travelers can mark offers as seen.
-- The existing "guide_offers_update_request_owner" RLS policy already allows
-- traveler-owned updates on this table, so no new policy is needed.
ALTER TABLE public.guide_offers
  ADD COLUMN IF NOT EXISTS traveler_read_at timestamptz;
