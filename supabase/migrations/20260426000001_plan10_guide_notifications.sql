-- Plan 10: Add new_request notification kind + guide profile location/capacity fields

-- 1. Add new_request to notification_kind enum
ALTER TYPE public.notification_kind ADD VALUE IF NOT EXISTS 'new_request';

-- 2. Add base_city and max_group_size to guide_profiles
ALTER TABLE public.guide_profiles
  ADD COLUMN IF NOT EXISTS base_city TEXT,
  ADD COLUMN IF NOT EXISTS max_group_size INTEGER CHECK (max_group_size > 0);

-- 3. Index for notification matching queries
CREATE INDEX IF NOT EXISTS guide_profiles_base_city_idx
  ON public.guide_profiles (lower(base_city))
  WHERE base_city IS NOT NULL AND is_available = true;
