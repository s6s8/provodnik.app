-- 20260516000001_themes_canon_religion.sql
-- ERR-091: the canonical theme list (src/data/themes.ts) must mirror the
-- traveler request-form vocabulary. Slot 8 was wrongly taken from the Guides
-- page (`photo`/Фотопрогулки); it is corrected to `religion`/Религия. The
-- guide_specializations_valid CHECK enumerated `photo` — swap to `religion`.
-- Existing `photo` values are removed first, else the new CHECK would reject
-- the rows that already carry them.

-- 1. Drop the old constraint so the data cleanup + recheck can proceed.
alter table public.guide_profiles
  drop constraint if exists guide_specializations_valid;

-- 2. Strip the now-invalid `photo` slug from existing data.
update public.guide_profiles
  set specializations = array_remove(specializations, 'photo')
  where 'photo' = any(specializations);

update public.traveler_requests
  set interests = array_remove(interests, 'photo')
  where 'photo' = any(interests);

-- 3. Re-add the constraint with the corrected canonical 8.
alter table public.guide_profiles
  add constraint guide_specializations_valid
  check (
    specializations <@ array[
      'history',
      'architecture',
      'nature',
      'food',
      'art',
      'religion',
      'kids',
      'unusual'
    ]::text[]
  );
