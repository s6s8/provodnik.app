-- Destinations table for the public catalog.
-- Previously stored in marketplace_events; now a proper table.

create table if not exists public.destinations (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  name text not null,
  region text not null,
  category text,
  description text,
  hero_image_url text,
  listing_count integer not null default 0,
  guides_count integer not null default 0,
  rating numeric,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.destinations enable row level security;

create policy "destinations_public_read"
  on public.destinations for select
  using (true);

create policy "destinations_admin_write"
  on public.destinations for all
  using (public.is_admin());

create trigger set_destinations_updated_at
  before update on public.destinations
  for each row execute procedure public.set_updated_at();
