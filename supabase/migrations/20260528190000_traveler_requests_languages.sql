ALTER TABLE public.traveler_requests
  ADD COLUMN IF NOT EXISTS requested_languages text[] NOT NULL DEFAULT '{}';
