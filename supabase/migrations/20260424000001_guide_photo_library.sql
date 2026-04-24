BEGIN;

-- 1. Add guide-portfolio to storage_asset_kind enum
ALTER TYPE storage_asset_kind ADD VALUE IF NOT EXISTS 'guide-portfolio';

-- 2. Create guide_location_photos table
CREATE TABLE IF NOT EXISTS guide_location_photos (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id         uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  storage_asset_id uuid        NOT NULL REFERENCES storage_assets(id) ON DELETE CASCADE,
  location_name    text        NOT NULL,
  sort_order       int         NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS guide_location_photos_guide_id_idx
  ON guide_location_photos(guide_id);

-- RLS
ALTER TABLE guide_location_photos ENABLE ROW LEVEL SECURITY;

-- guides manage their own photos
CREATE POLICY glp_guide_all ON guide_location_photos
  FOR ALL TO authenticated
  USING (guide_id = auth.uid())
  WITH CHECK (guide_id = auth.uid());

-- public can read (for profile pages)
CREATE POLICY glp_public_select ON guide_location_photos
  FOR SELECT TO anon, authenticated
  USING (true);

-- 3. Add route builder columns to guide_offers
ALTER TABLE guide_offers
  ADD COLUMN IF NOT EXISTS route_stops            jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS route_duration_minutes int;

COMMIT;
