drop view if exists public.public_listing_stats;
drop view if exists public.public_guide_stats;

drop table if exists public.moderation_actions cascade;
drop table if exists public.moderation_cases cascade;

drop type if exists public.moderation_decision cascade;
drop type if exists public.moderation_subject cascade;

create type public.moderation_subject as enum ('guide_profile', 'listing', 'review');
create type public.moderation_decision as enum ('approve', 'reject', 'request_changes', 'hide', 'restore');

create table public.moderation_cases (
  id uuid primary key default extensions.gen_random_uuid(),
  subject_type public.moderation_subject not null,
  guide_id uuid references public.profiles (id) on delete cascade,
  listing_id uuid references public.listings (id) on delete cascade,
  review_id uuid references public.reviews (id) on delete cascade,
  opened_by uuid references public.profiles (id) on delete set null,
  assigned_admin_id uuid references public.profiles (id) on delete set null,
  status text not null default 'open',
  queue_reason text not null,
  risk_flags text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint moderation_cases_subject_ref_check check (
    (subject_type = 'guide_profile' and guide_id is not null and listing_id is null and review_id is null) or
    (subject_type = 'listing' and listing_id is not null and guide_id is null and review_id is null) or
    (subject_type = 'review' and review_id is not null and guide_id is null and listing_id is null)
  )
);

create table public.moderation_actions (
  id uuid primary key default extensions.gen_random_uuid(),
  case_id uuid not null references public.moderation_cases (id) on delete cascade,
  admin_id uuid not null references public.profiles (id) on delete cascade,
  decision public.moderation_decision not null,
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

create view public.public_guide_stats as
select
  gp.user_id as guide_id,
  coalesce(avg(r.rating)::numeric(10,2), 0) as average_rating,
  count(r.id)::int as reviews_count,
  count(case when b.status = 'completed' then 1 end)::int as completed_bookings_count,
  count(case when b.status = 'cancelled' then 1 end)::int as cancelled_bookings_count,
  count(case when b.status in ('pending', 'awaiting_guide_confirmation', 'confirmed') then 1 end)::int as active_bookings_count
from public.guide_profiles gp
left join public.reviews r
  on r.guide_id = gp.user_id
 and r.status = 'published'
left join public.bookings b
  on b.guide_id = gp.user_id
group by gp.user_id;

create view public.public_listing_stats as
select
  l.id as listing_id,
  coalesce(avg(r.rating)::numeric(10,2), 0) as average_rating,
  count(r.id)::int as reviews_count,
  count(case when b.status = 'completed' then 1 end)::int as completed_bookings_count
from public.listings l
left join public.reviews r
  on r.listing_id = l.id
 and r.status = 'published'
left join public.bookings b
  on b.listing_id = l.id
group by l.id;

create index moderation_cases_status_idx
  on public.moderation_cases (status, created_at desc);

create index moderation_cases_subject_idx
  on public.moderation_cases (subject_type, created_at desc);

create index moderation_actions_case_idx
  on public.moderation_actions (case_id, created_at desc);

create trigger set_moderation_cases_updated_at
  before update on public.moderation_cases
  for each row execute procedure public.set_updated_at();

alter table public.moderation_cases enable row level security;
alter table public.moderation_actions enable row level security;

create policy "moderation_cases_admin_only"
  on public.moderation_cases for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "moderation_actions_admin_only"
  on public.moderation_actions for all
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.public_guide_stats to anon, authenticated;
grant select on public.public_listing_stats to anon, authenticated;
