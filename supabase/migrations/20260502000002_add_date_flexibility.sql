ALTER TABLE public.traveler_requests
  ADD COLUMN IF NOT EXISTS date_flexibility text NOT NULL DEFAULT 'exact'
  CHECK (date_flexibility IN ('exact', 'few_days', 'week'));
