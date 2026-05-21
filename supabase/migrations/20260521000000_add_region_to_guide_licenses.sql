ALTER TABLE public.guide_licenses
  ADD COLUMN IF NOT EXISTS region text;
