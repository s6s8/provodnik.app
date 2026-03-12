drop trigger if exists on_auth_user_created on auth.users;

drop table if exists public.dispute_notes cascade;
drop table if exists public.disputes cascade;
drop table if exists public.reviews cascade;
drop table if exists public.notifications cascade;
drop table if exists public.favorites cascade;
drop table if exists public.bookings cascade;
drop table if exists public.guide_offers cascade;
drop table if exists public.open_request_members cascade;
drop table if exists public.traveler_requests cascade;
drop table if exists public.listings cascade;
drop table if exists public.guide_profiles cascade;
drop table if exists public.profiles cascade;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.is_admin() cascade;
drop function if exists public.is_guide() cascade;
drop function if exists public.current_profile_role() cascade;
drop function if exists public.set_updated_at() cascade;

drop type if exists public.dispute_status cascade;
drop type if exists public.notification_kind cascade;
drop type if exists public.review_status cascade;
drop type if exists public.favorite_subject cascade;
drop type if exists public.booking_status cascade;
drop type if exists public.offer_status cascade;
drop type if exists public.member_status cascade;
drop type if exists public.request_status cascade;
drop type if exists public.listing_status cascade;
drop type if exists public.guide_verification_status cascade;
drop type if exists public.app_role cascade;

create extension if not exists "pgcrypto" with schema extensions;

create type public.app_role as enum ('traveler', 'guide', 'admin');
create type public.guide_verification_status as enum ('draft', 'submitted', 'approved', 'rejected');
create type public.listing_status as enum ('draft', 'published', 'paused', 'rejected');
create type public.request_status as enum ('open', 'booked', 'cancelled', 'expired');
create type public.member_status as enum ('joined', 'left');
create type public.offer_status as enum ('pending', 'accepted', 'declined', 'expired', 'withdrawn');
create type public.booking_status as enum ('pending', 'awaiting_guide_confirmation', 'confirmed', 'cancelled', 'completed', 'disputed', 'no_show');
create type public.favorite_subject as enum ('listing', 'guide');
create type public.review_status as enum ('published', 'flagged', 'hidden');
create type public.notification_kind as enum (
  'new_offer',
  'offer_expiring',
  'booking_created',
  'booking_confirmed',
  'booking_cancelled',
  'booking_completed',
  'dispute_opened',
  'review_requested',
  'admin_alert'
);
create type public.dispute_status as enum ('open', 'under_review', 'resolved', 'closed');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'traveler',
  email text,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.guide_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  slug text unique,
  display_name text,
  bio text,
  years_experience integer,
  regions text[] not null default '{}',
  languages text[] not null default '{}',
  specialties text[] not null default '{}',
  attestation_status text,
  verification_status public.guide_verification_status not null default 'draft',
  verification_notes text,
  payout_account_label text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint guide_profiles_years_experience_check
    check (years_experience is null or years_experience >= 0)
);

create table public.listings (
  id uuid primary key default extensions.gen_random_uuid(),
  guide_id uuid not null references public.profiles (id) on delete cascade,
  slug text not null unique,
  title text not null,
  region text not null,
  city text,
  category text not null,
  route_summary text,
  description text,
  duration_minutes integer,
  max_group_size integer not null default 1,
  price_from_minor integer not null,
  currency text not null default 'RUB',
  private_available boolean not null default true,
  group_available boolean not null default true,
  instant_book boolean not null default false,
  meeting_point text,
  inclusions text[] not null default '{}',
  exclusions text[] not null default '{}',
  cancellation_policy_key text not null default 'flexible',
  status public.listing_status not null default 'draft',
  featured_rank integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint listings_price_from_minor_check check (price_from_minor >= 0),
  constraint listings_duration_minutes_check check (duration_minutes is null or duration_minutes > 0),
  constraint listings_max_group_size_check check (max_group_size > 0)
);

create table public.traveler_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  traveler_id uuid not null references public.profiles (id) on delete cascade,
  destination text not null,
  region text,
  category text not null,
  starts_on date not null,
  ends_on date,
  budget_minor integer,
  currency text not null default 'RUB',
  participants_count integer not null default 1,
  format_preference text,
  notes text,
  open_to_join boolean not null default false,
  allow_guide_suggestions boolean not null default true,
  group_capacity integer,
  status public.request_status not null default 'open',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint traveler_requests_budget_minor_check check (budget_minor is null or budget_minor >= 0),
  constraint traveler_requests_participants_count_check check (participants_count > 0),
  constraint traveler_requests_group_capacity_check check (group_capacity is null or group_capacity > 0),
  constraint traveler_requests_ends_on_check check (ends_on is null or ends_on >= starts_on)
);

create table public.open_request_members (
  request_id uuid not null references public.traveler_requests (id) on delete cascade,
  traveler_id uuid not null references public.profiles (id) on delete cascade,
  status public.member_status not null default 'joined',
  joined_at timestamptz not null default timezone('utc', now()),
  left_at timestamptz,
  primary key (request_id, traveler_id)
);

create table public.guide_offers (
  id uuid primary key default extensions.gen_random_uuid(),
  request_id uuid not null references public.traveler_requests (id) on delete cascade,
  guide_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid references public.listings (id) on delete set null,
  title text,
  message text,
  price_minor integer not null,
  currency text not null default 'RUB',
  capacity integer not null default 1,
  starts_at timestamptz,
  ends_at timestamptz,
  inclusions text[] not null default '{}',
  expires_at timestamptz,
  status public.offer_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint guide_offers_price_minor_check check (price_minor >= 0),
  constraint guide_offers_capacity_check check (capacity > 0),
  constraint guide_offers_ends_at_check check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create table public.bookings (
  id uuid primary key default extensions.gen_random_uuid(),
  traveler_id uuid not null references public.profiles (id) on delete cascade,
  guide_id uuid not null references public.profiles (id) on delete cascade,
  request_id uuid references public.traveler_requests (id) on delete set null,
  offer_id uuid references public.guide_offers (id) on delete set null,
  listing_id uuid references public.listings (id) on delete set null,
  status public.booking_status not null default 'pending',
  party_size integer not null default 1,
  starts_at timestamptz,
  ends_at timestamptz,
  subtotal_minor integer not null default 0,
  deposit_minor integer not null default 0,
  remainder_minor integer not null default 0,
  currency text not null default 'RUB',
  cancellation_policy_snapshot jsonb not null default '{}'::jsonb,
  meeting_point text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint bookings_party_size_check check (party_size > 0),
  constraint bookings_amounts_check check (
    subtotal_minor >= 0 and deposit_minor >= 0 and remainder_minor >= 0
  ),
  constraint bookings_ends_at_check check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create table public.favorites (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject public.favorite_subject not null,
  listing_id uuid references public.listings (id) on delete cascade,
  guide_id uuid references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  constraint favorites_target_check check (
    (subject = 'listing' and listing_id is not null and guide_id is null) or
    (subject = 'guide' and guide_id is not null and listing_id is null)
  )
);

create table public.notifications (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind public.notification_kind not null,
  title text not null,
  body text,
  href text,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.reviews (
  id uuid primary key default extensions.gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  traveler_id uuid not null references public.profiles (id) on delete cascade,
  guide_id uuid references public.profiles (id) on delete cascade,
  listing_id uuid references public.listings (id) on delete set null,
  rating integer not null,
  title text,
  body text,
  status public.review_status not null default 'published',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint reviews_rating_check check (rating between 1 and 5)
);

create table public.disputes (
  id uuid primary key default extensions.gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  opened_by uuid not null references public.profiles (id) on delete cascade,
  assigned_admin_id uuid references public.profiles (id) on delete set null,
  status public.dispute_status not null default 'open',
  reason text not null,
  summary text,
  requested_outcome text,
  payout_frozen boolean not null default false,
  resolution_summary text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  resolved_at timestamptz
);

create table public.dispute_notes (
  id uuid primary key default extensions.gen_random_uuid(),
  dispute_id uuid not null references public.disputes (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  note text not null,
  internal_only boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create index listings_guide_status_idx on public.listings (guide_id, status);
create index listings_region_status_idx on public.listings (region, status);
create index traveler_requests_owner_status_idx on public.traveler_requests (traveler_id, status);
create index traveler_requests_open_join_idx on public.traveler_requests (open_to_join, status, starts_on);
create index open_request_members_traveler_idx on public.open_request_members (traveler_id, status);
create index guide_offers_request_status_idx on public.guide_offers (request_id, status);
create index guide_offers_guide_status_idx on public.guide_offers (guide_id, status);
create index bookings_traveler_status_idx on public.bookings (traveler_id, status);
create index bookings_guide_status_idx on public.bookings (guide_id, status);
create index notifications_user_read_idx on public.notifications (user_id, is_read, created_at desc);
create index reviews_guide_status_idx on public.reviews (guide_id, status, created_at desc);
create index reviews_listing_status_idx on public.reviews (listing_id, status, created_at desc);
create index disputes_status_idx on public.disputes (status, created_at desc);
create index disputes_assigned_admin_idx on public.disputes (assigned_admin_id, status);
create unique index favorites_listing_unique_idx
  on public.favorites (user_id, listing_id)
  where subject = 'listing';
create unique index favorites_guide_unique_idx
  on public.favorites (user_id, guide_id)
  where subject = 'guide';

create or replace function public.current_profile_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_profile_role() = 'admin'::public.app_role
$$;

create or replace function public.is_guide()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_profile_role() = 'guide'::public.app_role
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  role_text text;
  desired_role public.app_role;
begin
  role_text := coalesce(new.raw_user_meta_data ->> 'role', 'traveler');
  desired_role := case
    when role_text = 'guide' then 'guide'::public.app_role
    when role_text = 'admin' then 'admin'::public.app_role
    else 'traveler'::public.app_role
  end;

  insert into public.profiles (id, role, email, full_name, avatar_url)
  values (
    new.id,
    desired_role,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
        updated_at = timezone('utc', now());

  if desired_role = 'guide' then
    insert into public.guide_profiles (user_id, display_name)
    values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1)))
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger set_guide_profiles_updated_at
  before update on public.guide_profiles
  for each row execute procedure public.set_updated_at();

create trigger set_listings_updated_at
  before update on public.listings
  for each row execute procedure public.set_updated_at();

create trigger set_traveler_requests_updated_at
  before update on public.traveler_requests
  for each row execute procedure public.set_updated_at();

create trigger set_guide_offers_updated_at
  before update on public.guide_offers
  for each row execute procedure public.set_updated_at();

create trigger set_bookings_updated_at
  before update on public.bookings
  for each row execute procedure public.set_updated_at();

create trigger set_reviews_updated_at
  before update on public.reviews
  for each row execute procedure public.set_updated_at();

create trigger set_disputes_updated_at
  before update on public.disputes
  for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.guide_profiles enable row level security;
alter table public.listings enable row level security;
alter table public.traveler_requests enable row level security;
alter table public.open_request_members enable row level security;
alter table public.guide_offers enable row level security;
alter table public.bookings enable row level security;
alter table public.favorites enable row level security;
alter table public.notifications enable row level security;
alter table public.reviews enable row level security;
alter table public.disputes enable row level security;
alter table public.dispute_notes enable row level security;

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "profiles_insert_self"
  on public.profiles for insert
  with check (auth.uid() = id or public.is_admin());

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

create policy "guide_profiles_public_read_published"
  on public.guide_profiles for select
  using (verification_status = 'approved' or auth.uid() = user_id or public.is_admin());

create policy "guide_profiles_insert_owner_or_admin"
  on public.guide_profiles for insert
  with check (auth.uid() = user_id or public.is_admin());

create policy "guide_profiles_update_owner_or_admin"
  on public.guide_profiles for update
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy "listings_public_read_published"
  on public.listings for select
  using (status = 'published' or auth.uid() = guide_id or public.is_admin());

create policy "listings_insert_guide_or_admin"
  on public.listings for insert
  with check (auth.uid() = guide_id or public.is_admin());

create policy "listings_update_guide_or_admin"
  on public.listings for update
  using (auth.uid() = guide_id or public.is_admin())
  with check (auth.uid() = guide_id or public.is_admin());

create policy "traveler_requests_select_owner_joinable_guide_or_admin"
  on public.traveler_requests for select
  using (
    auth.uid() = traveler_id
    or public.is_admin()
    or (
      public.is_guide()
      and status = 'open'
    )
    or (
      open_to_join
      and status = 'open'
      and auth.uid() is not null
    )
  );

create policy "traveler_requests_insert_owner_or_admin"
  on public.traveler_requests for insert
  with check (auth.uid() = traveler_id or public.is_admin());

create policy "traveler_requests_update_owner_or_admin"
  on public.traveler_requests for update
  using (auth.uid() = traveler_id or public.is_admin())
  with check (auth.uid() = traveler_id or public.is_admin());

create policy "open_request_members_select_visible_scope"
  on public.open_request_members for select
  using (
    traveler_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1
      from public.traveler_requests tr
      where tr.id = request_id
        and (
          tr.traveler_id = auth.uid()
          or (tr.open_to_join and tr.status = 'open' and auth.uid() is not null)
        )
    )
  );

create policy "open_request_members_insert_self_or_admin"
  on public.open_request_members for insert
  with check (traveler_id = auth.uid() or public.is_admin());

create policy "open_request_members_update_self_owner_or_admin"
  on public.open_request_members for update
  using (
    traveler_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.traveler_requests tr
      where tr.id = request_id and tr.traveler_id = auth.uid()
    )
  )
  with check (
    traveler_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.traveler_requests tr
      where tr.id = request_id and tr.traveler_id = auth.uid()
    )
  );

create policy "guide_offers_select_related_users"
  on public.guide_offers for select
  using (
    guide_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1
      from public.traveler_requests tr
      where tr.id = request_id and tr.traveler_id = auth.uid()
    )
  );

create policy "guide_offers_insert_guide_or_admin"
  on public.guide_offers for insert
  with check (guide_id = auth.uid() or public.is_admin());

create policy "guide_offers_update_guide_or_admin"
  on public.guide_offers for update
  using (guide_id = auth.uid() or public.is_admin())
  with check (guide_id = auth.uid() or public.is_admin());

create policy "bookings_select_related_users"
  on public.bookings for select
  using (traveler_id = auth.uid() or guide_id = auth.uid() or public.is_admin());

create policy "bookings_insert_traveler_or_admin"
  on public.bookings for insert
  with check (traveler_id = auth.uid() or public.is_admin());

create policy "bookings_update_related_users"
  on public.bookings for update
  using (traveler_id = auth.uid() or guide_id = auth.uid() or public.is_admin())
  with check (traveler_id = auth.uid() or guide_id = auth.uid() or public.is_admin());

create policy "favorites_owner_only"
  on public.favorites for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "notifications_owner_only"
  on public.notifications for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "reviews_public_read_published"
  on public.reviews for select
  using (status = 'published' or traveler_id = auth.uid() or public.is_admin());

create policy "reviews_insert_completed_booking_owner"
  on public.reviews for insert
  with check (
    traveler_id = auth.uid()
    and exists (
      select 1
      from public.bookings b
      where b.id = booking_id
        and b.traveler_id = auth.uid()
        and b.status = 'completed'
    )
  );

create policy "reviews_update_owner_or_admin"
  on public.reviews for update
  using (traveler_id = auth.uid() or public.is_admin())
  with check (traveler_id = auth.uid() or public.is_admin());

create policy "disputes_select_related_users"
  on public.disputes for select
  using (
    opened_by = auth.uid()
    or assigned_admin_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1
      from public.bookings b
      where b.id = booking_id
        and (b.traveler_id = auth.uid() or b.guide_id = auth.uid())
    )
  );

create policy "disputes_insert_related_booking_user"
  on public.disputes for insert
  with check (
    opened_by = auth.uid()
    and exists (
      select 1
      from public.bookings b
      where b.id = booking_id
        and (b.traveler_id = auth.uid() or b.guide_id = auth.uid() or public.is_admin())
    )
  );

create policy "disputes_update_admin_only"
  on public.disputes for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "dispute_notes_select_related_users"
  on public.dispute_notes for select
  using (
    public.is_admin()
    or exists (
      select 1
      from public.disputes d
      join public.bookings b on b.id = d.booking_id
      where d.id = dispute_id
        and not internal_only
        and (b.traveler_id = auth.uid() or b.guide_id = auth.uid())
    )
  );

create policy "dispute_notes_admin_only_write"
  on public.dispute_notes for insert
  with check (public.is_admin());

create policy "dispute_notes_admin_only_update"
  on public.dispute_notes for update
  using (public.is_admin())
  with check (public.is_admin());
