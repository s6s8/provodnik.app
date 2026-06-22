-- J0-T28 — Consolidated additive foundation migration (idempotent, ADDITIVE-ONLY).
-- Probed prod 2026-06-23: guide_profiles.years_experience, listings.meeting_point,
-- favorites/favorites_folders/favorites_items already exist → skipped.
-- Does NOT touch v_guide_public_profile / search_guides (42804 landmine).

begin;

-- ── Additive columns (ADD COLUMN IF NOT EXISTS) ──
alter table public.guide_profiles add column if not exists headline text;
alter table public.guide_profiles add column if not exists contact_visibility_recalc_at timestamptz;
alter table public.destinations add column if not exists tagline text;
alter table public.profiles add column if not exists telegram_chat_id text;
alter table public.profiles add column if not exists travel_interests text[];
alter table public.profiles add column if not exists group_preference text;
alter table public.notifications add column if not exists actor_avatar_url text;
alter table public.notifications add column if not exists amount numeric;
alter table public.notifications add column if not exists entity_type text;
alter table public.notifications add column if not exists entity_id uuid;
alter table public.help_articles add column if not exists is_published boolean not null default true;

-- ── listing_inclusions ──
create table if not exists public.listing_inclusions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  kind text not null default 'included',
  text text not null,
  created_at timestamptz not null default now()
);
alter table public.listing_inclusions enable row level security;
drop policy if exists listing_inclusions_select_all on public.listing_inclusions;
create policy listing_inclusions_select_all on public.listing_inclusions for select using (true);
grant select on public.listing_inclusions to anon, authenticated;

-- ── referral_program_config (singleton, public-readable config) ──
create table if not exists public.referral_program_config (
  id int primary key default 1,
  inviter_reward_minor int not null default 50000,
  invitee_reward_minor int not null default 50000,
  redeem_mode text not null default 'manual_promo',
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint referral_program_config_singleton check (id = 1)
);
insert into public.referral_program_config (id) values (1) on conflict (id) do nothing;
alter table public.referral_program_config enable row level security;
drop policy if exists referral_config_select_all on public.referral_program_config;
create policy referral_config_select_all on public.referral_program_config for select using (true);
grant select on public.referral_program_config to anon, authenticated;

-- ── guide_testimonials (published-only public read) ──
create table if not exists public.guide_testimonials (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references public.profiles(id) on delete cascade,
  quote text not null,
  payout_period text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.guide_testimonials enable row level security;
drop policy if exists guide_testimonials_select_published on public.guide_testimonials;
create policy guide_testimonials_select_published on public.guide_testimonials for select using (is_published = true);
grant select on public.guide_testimonials to anon, authenticated;

-- ── business_leads (public write-only; admin reads via service role) ──
create table if not exists public.business_leads (
  id uuid primary key default gen_random_uuid(),
  company text,
  contact text not null,
  city text,
  dates text,
  headcount int,
  note text,
  created_at timestamptz not null default now()
);
alter table public.business_leads enable row level security;
drop policy if exists business_leads_insert_any on public.business_leads;
create policy business_leads_insert_any on public.business_leads for insert to anon, authenticated with check (true);
grant insert on public.business_leads to anon, authenticated;

-- ── platform_stats (REAL counts — zero fabrication) ──
create or replace view public.platform_stats as
select
  (select count(*)::int from public.guide_profiles) as guides_active,
  (select count(*)::int from public.listings) as listings_total,
  (select count(*)::int from public.bookings) as trips_total;
grant select on public.platform_stats to anon, authenticated;

commit;
