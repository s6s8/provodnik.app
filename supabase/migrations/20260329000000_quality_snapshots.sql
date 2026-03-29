-- Quality snapshots: marketplace quality metrics for guides and listings.
-- Used by the public-listing-card quality badge and future guide quality card.

create table if not exists public.quality_snapshots (
  subject_type text not null,        -- 'guide' | 'listing'
  subject_slug text not null,
  tier text not null default 'unrated', -- 'gold' | 'silver' | 'bronze' | 'unrated'
  response_time_hours numeric,
  completion_rate numeric,
  rating_avg numeric,
  review_count integer not null default 0,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (subject_type, subject_slug)
);

-- RLS: public read, admin write
alter table public.quality_snapshots enable row level security;

drop policy if exists "quality_snapshots_public_read" on public.quality_snapshots;
create policy "quality_snapshots_public_read"
  on public.quality_snapshots for select
  using (true);

drop policy if exists "quality_snapshots_admin_write" on public.quality_snapshots;
create policy "quality_snapshots_admin_write"
  on public.quality_snapshots for all
  using (public.is_admin());
