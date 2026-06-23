-- C3 — additive columns (review recommendation + request expiry). ADDITIVE, reversible.
alter table public.reviews add column if not exists would_recommend boolean;
alter table public.traveler_requests add column if not exists expires_at timestamptz;
