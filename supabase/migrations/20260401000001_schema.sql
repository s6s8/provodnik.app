-- =============================================================================
-- Provodnik — FULL SCHEMA
-- Single source of truth. Run after drop_all.sql.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------------
create type public.app_role                  as enum ('traveler', 'guide', 'admin');
create type public.guide_verification_status as enum ('draft', 'submitted', 'approved', 'rejected');
create type public.listing_status            as enum ('draft', 'published', 'paused', 'rejected');
create type public.request_status            as enum ('open', 'booked', 'cancelled', 'expired');
create type public.member_status             as enum ('joined', 'left');
create type public.offer_status              as enum ('pending', 'accepted', 'declined', 'expired', 'withdrawn');
create type public.booking_status            as enum ('pending', 'awaiting_guide_confirmation', 'confirmed', 'cancelled', 'completed', 'disputed', 'no_show');
create type public.favorite_subject          as enum ('listing', 'guide');
create type public.review_status             as enum ('published', 'flagged', 'hidden');
create type public.notification_kind         as enum ('new_offer', 'offer_expiring', 'booking_created', 'booking_confirmed', 'booking_cancelled', 'booking_completed', 'dispute_opened', 'review_requested', 'admin_alert');
create type public.dispute_status            as enum ('open', 'under_review', 'resolved', 'closed');
create type public.storage_asset_kind        as enum ('guide-avatar', 'guide-document', 'listing-cover', 'listing-gallery', 'dispute-evidence');
create type public.thread_subject            as enum ('request', 'offer', 'booking', 'dispute');
create type public.message_sender_role       as enum ('traveler', 'guide', 'admin', 'system');
create type public.event_scope               as enum ('request', 'booking', 'dispute', 'moderation');
create type public.moderation_subject        as enum ('guide_profile', 'listing', 'review');
create type public.moderation_decision       as enum ('approve', 'reject', 'request_changes', 'hide', 'restore');

-- ---------------------------------------------------------------------------
-- BASIC HELPER FUNCTIONS (needed by tables/policies below)
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- TABLES
-- ---------------------------------------------------------------------------

-- profiles
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        public.app_role not null default 'traveler',
  email       text,
  full_name   text,
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default timezone('utc', now()),
  updated_at  timestamptz not null default timezone('utc', now())
);
alter table public.profiles enable row level security;
create trigger set_profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- Role helper functions — must come after profiles table
create or replace function public.current_profile_role()
returns public.app_role language sql security definer stable set search_path = public as $$
  select role from public.profiles where id = (select auth.uid());
$$;

create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select public.current_profile_role() = 'admin'::public.app_role;
$$;

create or replace function public.is_guide()
returns boolean language sql security definer stable set search_path = public as $$
  select public.current_profile_role() = 'guide'::public.app_role;
$$;

-- guide_profiles
create table public.guide_profiles (
  user_id               uuid primary key references public.profiles(id) on delete cascade,
  slug                  text unique,
  display_name          text,
  bio                   text,
  years_experience      integer check (years_experience >= 0),
  regions               text[] not null default '{}',
  languages             text[] not null default '{}',
  specialties           text[] not null default '{}',
  specialization        text,
  attestation_status    text,
  verification_status   public.guide_verification_status not null default 'draft',
  verification_notes    text,
  payout_account_label  text,
  rating                numeric(2,1) not null default 0.0 check (rating >= 0 and rating <= 5),
  completed_tours       integer not null default 0 check (completed_tours >= 0),
  is_available          boolean not null default false,
  created_at            timestamptz not null default timezone('utc', now()),
  updated_at            timestamptz not null default timezone('utc', now())
);
alter table public.guide_profiles enable row level security;
create trigger set_guide_profiles_updated_at before update on public.guide_profiles
  for each row execute procedure public.set_updated_at();

-- listings
create table public.listings (
  id                      uuid primary key default extensions.gen_random_uuid(),
  guide_id                uuid not null references public.profiles(id) on delete cascade,
  slug                    text not null unique,
  title                   text not null,
  region                  text not null,
  city                    text,
  category                text not null,
  route_summary           text,
  description             text,
  duration_minutes        integer check (duration_minutes > 0),
  max_group_size          integer not null default 1 check (max_group_size > 0),
  price_from_minor        integer not null check (price_from_minor >= 0),
  currency                text not null default 'RUB',
  private_available       boolean not null default true,
  group_available         boolean not null default true,
  instant_book            boolean not null default false,
  meeting_point           text,
  inclusions              text[] not null default '{}',
  exclusions              text[] not null default '{}',
  cancellation_policy_key text not null default 'flexible',
  status                  public.listing_status not null default 'draft',
  featured_rank           integer,
  created_at              timestamptz not null default timezone('utc', now()),
  updated_at              timestamptz not null default timezone('utc', now())
);
alter table public.listings enable row level security;
create index listings_guide_status_idx  on public.listings (guide_id, status);
create index listings_region_status_idx on public.listings (region, status);
create trigger set_listings_updated_at before update on public.listings
  for each row execute procedure public.set_updated_at();

-- traveler_requests
create table public.traveler_requests (
  id                      uuid primary key default extensions.gen_random_uuid(),
  traveler_id             uuid not null references public.profiles(id) on delete cascade,
  destination             text not null,
  region                  text,
  category                text not null,
  starts_on               date not null,
  ends_on                 date check (ends_on >= starts_on),
  budget_minor            integer check (budget_minor >= 0),
  currency                text not null default 'RUB',
  participants_count      integer not null default 1 check (participants_count > 0),
  format_preference       text,
  notes                   text,
  open_to_join            boolean not null default false,
  allow_guide_suggestions boolean not null default true,
  group_capacity          integer check (group_capacity > 0),
  status                  public.request_status not null default 'open',
  created_at              timestamptz not null default timezone('utc', now()),
  updated_at              timestamptz not null default timezone('utc', now())
);
alter table public.traveler_requests enable row level security;
create index traveler_requests_owner_status_idx on public.traveler_requests (traveler_id, status);
create index traveler_requests_open_join_idx    on public.traveler_requests (open_to_join, status, starts_on);
create trigger set_traveler_requests_updated_at before update on public.traveler_requests
  for each row execute procedure public.set_updated_at();

-- open_request_members
create table public.open_request_members (
  request_id  uuid not null references public.traveler_requests(id) on delete cascade,
  traveler_id uuid not null references public.profiles(id) on delete cascade,
  status      public.member_status not null default 'joined',
  joined_at   timestamptz not null default timezone('utc', now()),
  left_at     timestamptz,
  primary key (request_id, traveler_id)
);
alter table public.open_request_members enable row level security;
create index open_request_members_traveler_idx on public.open_request_members (traveler_id, status);

-- guide_offers
create table public.guide_offers (
  id          uuid primary key default extensions.gen_random_uuid(),
  request_id  uuid not null references public.traveler_requests(id) on delete cascade,
  guide_id    uuid not null references public.profiles(id) on delete cascade,
  listing_id  uuid references public.listings(id) on delete set null,
  title       text,
  message     text,
  price_minor integer not null check (price_minor >= 0),
  currency    text not null default 'RUB',
  capacity    integer not null default 1 check (capacity > 0),
  starts_at   timestamptz,
  ends_at     timestamptz check (ends_at >= starts_at),
  inclusions  text[] not null default '{}',
  expires_at  timestamptz,
  status      public.offer_status not null default 'pending',
  created_at  timestamptz not null default timezone('utc', now()),
  updated_at  timestamptz not null default timezone('utc', now())
);
alter table public.guide_offers enable row level security;
create index guide_offers_request_status_idx on public.guide_offers (request_id, status);
create index guide_offers_guide_status_idx   on public.guide_offers (guide_id, status);
create trigger set_guide_offers_updated_at before update on public.guide_offers
  for each row execute procedure public.set_updated_at();

-- bookings
create table public.bookings (
  id                            uuid primary key default extensions.gen_random_uuid(),
  traveler_id                   uuid not null references public.profiles(id) on delete cascade,
  guide_id                      uuid not null references public.profiles(id) on delete cascade,
  request_id                    uuid references public.traveler_requests(id) on delete set null,
  offer_id                      uuid references public.guide_offers(id) on delete set null,
  listing_id                    uuid references public.listings(id) on delete set null,
  status                        public.booking_status not null default 'pending',
  party_size                    integer not null default 1 check (party_size > 0),
  starts_at                     timestamptz,
  ends_at                       timestamptz check (ends_at >= starts_at),
  subtotal_minor                integer not null default 0,
  deposit_minor                 integer not null default 0,
  remainder_minor               integer not null default 0,
  currency                      text not null default 'RUB',
  cancellation_policy_snapshot  jsonb not null default '{}',
  meeting_point                 text,
  created_at                    timestamptz not null default timezone('utc', now()),
  updated_at                    timestamptz not null default timezone('utc', now()),
  check (subtotal_minor >= 0 and deposit_minor >= 0 and remainder_minor >= 0)
);
alter table public.bookings enable row level security;
create index bookings_traveler_status_idx on public.bookings (traveler_id, status);
create index bookings_guide_status_idx    on public.bookings (guide_id, status);
create trigger set_bookings_updated_at before update on public.bookings
  for each row execute procedure public.set_updated_at();

-- reviews
create table public.reviews (
  id          uuid primary key default extensions.gen_random_uuid(),
  booking_id  uuid not null unique references public.bookings(id) on delete cascade,
  traveler_id uuid not null references public.profiles(id) on delete cascade,
  guide_id    uuid references public.profiles(id) on delete cascade,
  listing_id  uuid references public.listings(id) on delete set null,
  rating      integer not null check (rating between 1 and 5),
  title       text,
  body        text,
  status      public.review_status not null default 'published',
  created_at  timestamptz not null default timezone('utc', now()),
  updated_at  timestamptz not null default timezone('utc', now())
);
alter table public.reviews enable row level security;
create index reviews_guide_status_idx   on public.reviews (guide_id, status, created_at desc);
create index reviews_listing_status_idx on public.reviews (listing_id, status, created_at desc);
create trigger set_reviews_updated_at before update on public.reviews
  for each row execute procedure public.set_updated_at();

-- favorites
create table public.favorites (
  id         uuid primary key default extensions.gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  subject    public.favorite_subject not null,
  listing_id uuid references public.listings(id) on delete cascade,
  guide_id   uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  check (
    (subject = 'listing' and listing_id is not null and guide_id is null) or
    (subject = 'guide'   and guide_id   is not null and listing_id is null)
  )
);
alter table public.favorites enable row level security;
create unique index favorites_listing_unique_idx on public.favorites (user_id, listing_id) where subject = 'listing';
create unique index favorites_guide_unique_idx   on public.favorites (user_id, guide_id)   where subject = 'guide';

-- notifications
create table public.notifications (
  id         uuid primary key default extensions.gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  kind       public.notification_kind not null,
  title      text not null,
  body       text,
  href       text,
  is_read    boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);
alter table public.notifications enable row level security;
create index notifications_user_read_idx on public.notifications (user_id, is_read, created_at desc);

-- notification_deliveries
create table public.notification_deliveries (
  id                  uuid primary key default extensions.gen_random_uuid(),
  notification_id     uuid not null references public.notifications(id) on delete cascade,
  channel             text not null,
  status              text not null default 'pending',
  provider_message_id text,
  attempted_at        timestamptz,
  delivered_at        timestamptz,
  error_message       text,
  created_at          timestamptz not null default timezone('utc', now())
);
alter table public.notification_deliveries enable row level security;
create index notification_deliveries_notification_idx on public.notification_deliveries (notification_id, created_at desc);

-- disputes
create table public.disputes (
  id                  uuid primary key default extensions.gen_random_uuid(),
  booking_id          uuid not null references public.bookings(id) on delete cascade,
  opened_by           uuid not null references public.profiles(id) on delete cascade,
  assigned_admin_id   uuid references public.profiles(id) on delete set null,
  status              public.dispute_status not null default 'open',
  reason              text not null,
  summary             text,
  requested_outcome   text,
  payout_frozen       boolean not null default false,
  resolution_summary  text,
  created_at          timestamptz not null default timezone('utc', now()),
  updated_at          timestamptz not null default timezone('utc', now()),
  resolved_at         timestamptz
);
alter table public.disputes enable row level security;
create index disputes_status_idx         on public.disputes (status, created_at desc);
create index disputes_assigned_admin_idx on public.disputes (assigned_admin_id, status);
create trigger set_disputes_updated_at before update on public.disputes
  for each row execute procedure public.set_updated_at();

-- dispute_notes
create table public.dispute_notes (
  id            uuid primary key default extensions.gen_random_uuid(),
  dispute_id    uuid not null references public.disputes(id) on delete cascade,
  author_id     uuid not null references public.profiles(id) on delete cascade,
  note          text not null,
  internal_only boolean not null default true,
  created_at    timestamptz not null default timezone('utc', now())
);
alter table public.dispute_notes enable row level security;

-- conversation_threads
create table public.conversation_threads (
  id           uuid primary key default extensions.gen_random_uuid(),
  subject_type public.thread_subject not null,
  request_id   uuid references public.traveler_requests(id) on delete cascade,
  offer_id     uuid references public.guide_offers(id) on delete cascade,
  booking_id   uuid references public.bookings(id) on delete cascade,
  dispute_id   uuid references public.disputes(id) on delete cascade,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default timezone('utc', now()),
  updated_at   timestamptz not null default timezone('utc', now()),
  check (
    (subject_type = 'request' and request_id is not null and offer_id is null  and booking_id is null and dispute_id is null) or
    (subject_type = 'offer'   and offer_id   is not null and request_id is null and booking_id is null and dispute_id is null) or
    (subject_type = 'booking' and booking_id is not null and request_id is null and offer_id   is null and dispute_id is null) or
    (subject_type = 'dispute' and dispute_id is not null and request_id is null and offer_id   is null and booking_id is null)
  )
);
alter table public.conversation_threads enable row level security;
create unique index ct_request_unique_idx on public.conversation_threads (request_id) where request_id is not null;
create unique index ct_offer_unique_idx   on public.conversation_threads (offer_id)   where offer_id   is not null;
create unique index ct_booking_unique_idx on public.conversation_threads (booking_id) where booking_id is not null;
create unique index ct_dispute_unique_idx on public.conversation_threads (dispute_id) where dispute_id is not null;
create index conversation_threads_subject_idx on public.conversation_threads (subject_type, updated_at desc);
create trigger set_conversation_threads_updated_at before update on public.conversation_threads
  for each row execute procedure public.set_updated_at();

-- thread_participants
create table public.thread_participants (
  thread_id    uuid not null references public.conversation_threads(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  joined_at    timestamptz not null default timezone('utc', now()),
  last_read_at timestamptz,
  primary key (thread_id, user_id)
);
alter table public.thread_participants enable row level security;
create index thread_participants_user_idx on public.thread_participants (user_id, last_read_at);

-- messages
create table public.messages (
  id          uuid primary key default extensions.gen_random_uuid(),
  thread_id   uuid not null references public.conversation_threads(id) on delete cascade,
  sender_id   uuid references public.profiles(id) on delete set null,
  sender_role public.message_sender_role not null,
  body        text not null,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default timezone('utc', now())
);
alter table public.messages enable row level security;
create index messages_thread_created_idx on public.messages (thread_id, created_at);

-- marketplace_events
create table public.marketplace_events (
  id         uuid primary key default extensions.gen_random_uuid(),
  scope      public.event_scope not null,
  request_id uuid references public.traveler_requests(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete cascade,
  dispute_id uuid references public.disputes(id) on delete cascade,
  actor_id   uuid references public.profiles(id) on delete set null,
  event_type text not null,
  summary    text not null,
  detail     text,
  payload    jsonb not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  check (
    (scope = 'request'    and request_id is not null) or
    (scope = 'booking'    and booking_id is not null) or
    (scope = 'dispute'    and dispute_id is not null) or
    (scope = 'moderation')
  )
);
alter table public.marketplace_events enable row level security;
create index marketplace_events_request_idx on public.marketplace_events (request_id, created_at desc);
create index marketplace_events_booking_idx on public.marketplace_events (booking_id, created_at desc);
create index marketplace_events_dispute_idx on public.marketplace_events (dispute_id, created_at desc);

-- storage_assets
create table public.storage_assets (
  id          uuid primary key default extensions.gen_random_uuid(),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  bucket_id   text not null,
  object_path text not null,
  asset_kind  public.storage_asset_kind not null,
  mime_type   text,
  byte_size   bigint,
  created_at  timestamptz not null default timezone('utc', now()),
  unique (bucket_id, object_path)
);
alter table public.storage_assets enable row level security;

-- guide_documents
create table public.guide_documents (
  id            uuid primary key default extensions.gen_random_uuid(),
  guide_id      uuid not null references public.profiles(id) on delete cascade,
  asset_id      uuid not null unique references public.storage_assets(id) on delete cascade,
  document_type text not null,
  status        public.guide_verification_status not null default 'submitted',
  admin_note    text,
  reviewed_by   uuid references public.profiles(id) on delete set null,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default timezone('utc', now())
);
alter table public.guide_documents enable row level security;
create index guide_documents_guide_status_idx on public.guide_documents (guide_id, status, created_at desc);

-- listing_media
create table public.listing_media (
  id         uuid primary key default extensions.gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  asset_id   uuid not null unique references public.storage_assets(id) on delete cascade,
  is_cover   boolean not null default false,
  sort_order integer not null default 0,
  alt_text   text,
  created_at timestamptz not null default timezone('utc', now())
);
alter table public.listing_media enable row level security;
create index listing_media_listing_sort_idx  on public.listing_media (listing_id, sort_order, created_at);
create unique index listing_media_cover_unique_idx on public.listing_media (listing_id) where is_cover;

-- dispute_evidence
create table public.dispute_evidence (
  id          uuid primary key default extensions.gen_random_uuid(),
  dispute_id  uuid not null references public.disputes(id) on delete cascade,
  asset_id    uuid not null unique references public.storage_assets(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  label       text,
  created_at  timestamptz not null default timezone('utc', now())
);
alter table public.dispute_evidence enable row level security;
create index dispute_evidence_dispute_idx on public.dispute_evidence (dispute_id, created_at desc);

-- moderation_cases
create table public.moderation_cases (
  id                uuid primary key default extensions.gen_random_uuid(),
  subject_type      public.moderation_subject not null,
  guide_id          uuid references public.profiles(id) on delete cascade,
  listing_id        uuid references public.listings(id) on delete cascade,
  review_id         uuid references public.reviews(id) on delete cascade,
  opened_by         uuid references public.profiles(id) on delete set null,
  assigned_admin_id uuid references public.profiles(id) on delete set null,
  status            text not null default 'open',
  queue_reason      text not null,
  risk_flags        text[] not null default '{}',
  created_at        timestamptz not null default timezone('utc', now()),
  updated_at        timestamptz not null default timezone('utc', now()),
  check (
    (subject_type = 'guide_profile' and guide_id   is not null and listing_id is null  and review_id is null) or
    (subject_type = 'listing'       and listing_id is not null and guide_id   is null  and review_id is null) or
    (subject_type = 'review'        and review_id  is not null and guide_id   is null  and listing_id is null)
  )
);
alter table public.moderation_cases enable row level security;
create index moderation_cases_status_idx  on public.moderation_cases (status, created_at desc);
create index moderation_cases_subject_idx on public.moderation_cases (subject_type, created_at desc);
create trigger set_moderation_cases_updated_at before update on public.moderation_cases
  for each row execute procedure public.set_updated_at();

-- moderation_actions
create table public.moderation_actions (
  id         uuid primary key default extensions.gen_random_uuid(),
  case_id    uuid not null references public.moderation_cases(id) on delete cascade,
  admin_id   uuid not null references public.profiles(id) on delete cascade,
  decision   public.moderation_decision not null,
  note       text,
  created_at timestamptz not null default timezone('utc', now())
);
alter table public.moderation_actions enable row level security;
create index moderation_actions_case_idx on public.moderation_actions (case_id, created_at desc);

-- quality_snapshots
create table public.quality_snapshots (
  subject_type          text not null,
  subject_slug          text not null,
  tier                  text not null default 'unrated',
  response_time_hours   numeric,
  completion_rate       numeric,
  rating_avg            numeric,
  review_count          integer not null default 0,
  updated_at            timestamptz not null default timezone('utc', now()),
  primary key (subject_type, subject_slug)
);
alter table public.quality_snapshots enable row level security;

-- destinations
create table public.destinations (
  id             uuid primary key default extensions.gen_random_uuid(),
  slug           text not null unique,
  name           text not null,
  region         text not null,
  category       text,
  description    text,
  hero_image_url text,
  listing_count  integer not null default 0,
  guides_count   integer not null default 0,
  rating         numeric,
  created_at     timestamptz not null default timezone('utc', now()),
  updated_at     timestamptz not null default timezone('utc', now())
);
alter table public.destinations enable row level security;
create trigger set_destinations_updated_at before update on public.destinations
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- AUTH TRIGGER: auto-create profile on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role      public.app_role;
  v_full_name text;
begin
  v_role := coalesce(
    (new.raw_user_meta_data->>'role')::public.app_role,
    'traveler'::public.app_role
  );
  v_full_name := coalesce(new.raw_user_meta_data->>'full_name', '');

  insert into public.profiles (id, role, email, full_name)
  values (new.id, v_role, new.email, v_full_name)
  on conflict (id) do nothing;

  if v_role = 'guide'::public.app_role then
    insert into public.guide_profiles (user_id, display_name, specialization)
    values (
      new.id,
      v_full_name,
      coalesce(new.raw_user_meta_data->>'specialization', '')
    )
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- MESSAGE TRIGGER: keep thread updated_at in sync
-- ---------------------------------------------------------------------------
create or replace function public.touch_thread_updated_at()
returns trigger language plpgsql as $$
begin
  update public.conversation_threads
  set updated_at = timezone('utc', now())
  where id = new.thread_id;
  return new;
end;
$$;

create trigger touch_thread_on_message_insert
  after insert on public.messages
  for each row execute procedure public.touch_thread_updated_at();

-- ---------------------------------------------------------------------------
-- GUIDE PROFILE ONBOARDING HELPERS
-- ---------------------------------------------------------------------------
create or replace function public.clean_text_array(input_array text[])
returns text[] language sql immutable as $$
  select coalesce(
    array_agg(value order by ordinality),
    '{}'::text[]
  )
  from (
    select distinct on (value) value, ordinality
    from (
      select nullif(btrim(entry), '') as value, ordinality
      from unnest(coalesce(input_array, '{}'::text[])) with ordinality as entries(entry, ordinality)
    ) trimmed
    where value is not null
    order by value, ordinality
  ) cleaned;
$$;

create or replace function public.sync_guide_profile_onboarding_fields()
returns trigger language plpgsql as $$
begin
  new.bio            := nullif(btrim(new.bio), '');
  new.specialization := nullif(btrim(new.specialization), '');
  new.regions        := public.clean_text_array(new.regions);
  new.languages      := public.clean_text_array(new.languages);
  new.specialties    := public.clean_text_array(new.specialties);
  new.is_available   := coalesce(new.is_available, false);

  if new.specialization is null and coalesce(array_length(new.specialties, 1), 0) > 0 then
    new.specialization := new.specialties[1];
  elsif new.specialization is not null and coalesce(array_length(new.specialties, 1), 0) = 0 then
    new.specialties := array[new.specialization];
  end if;

  return new;
end;
$$;

create trigger sync_guide_profiles_onboarding_fields
  before insert or update on public.guide_profiles
  for each row execute procedure public.sync_guide_profile_onboarding_fields();

-- ---------------------------------------------------------------------------
-- ACCESS HELPER FUNCTIONS (used by RLS policies)
-- ---------------------------------------------------------------------------
create or replace function public.user_has_role(target_user_id uuid, expected_role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select target_user_id is not null
    and exists (
      select 1 from public.profiles p
      where p.id = target_user_id and p.role = expected_role
    );
$$;

create or replace function public.can_access_request_thread(target_request_id uuid, target_user_id uuid default null)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(target_user_id, (select auth.uid())) is not null
    and exists (
      select 1 from public.traveler_requests tr
      where tr.id = target_request_id
        and (
          tr.traveler_id = coalesce(target_user_id, (select auth.uid()))
          or public.user_has_role(coalesce(target_user_id, (select auth.uid())), 'guide'::public.app_role)
          or public.user_has_role(coalesce(target_user_id, (select auth.uid())), 'admin'::public.app_role)
        )
    );
$$;

create or replace function public.can_access_offer_thread(target_offer_id uuid, target_user_id uuid default null)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(target_user_id, (select auth.uid())) is not null
    and exists (
      select 1 from public.guide_offers go
      join public.traveler_requests tr on tr.id = go.request_id
      where go.id = target_offer_id
        and (
          go.guide_id      = coalesce(target_user_id, (select auth.uid()))
          or tr.traveler_id = coalesce(target_user_id, (select auth.uid()))
          or public.user_has_role(coalesce(target_user_id, (select auth.uid())), 'admin'::public.app_role)
        )
    );
$$;

create or replace function public.can_access_booking_thread(target_booking_id uuid, target_user_id uuid default null)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(target_user_id, (select auth.uid())) is not null
    and exists (
      select 1 from public.bookings b
      where b.id = target_booking_id
        and (
          b.traveler_id = coalesce(target_user_id, (select auth.uid()))
          or b.guide_id = coalesce(target_user_id, (select auth.uid()))
          or public.user_has_role(coalesce(target_user_id, (select auth.uid())), 'admin'::public.app_role)
        )
    );
$$;

create or replace function public.can_access_dispute_thread(target_dispute_id uuid, target_user_id uuid default null)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(target_user_id, (select auth.uid())) is not null
    and exists (
      select 1 from public.disputes d
      join public.bookings b on b.id = d.booking_id
      where d.id = target_dispute_id
        and (
          d.opened_by            = coalesce(target_user_id, (select auth.uid()))
          or d.assigned_admin_id = coalesce(target_user_id, (select auth.uid()))
          or b.traveler_id       = coalesce(target_user_id, (select auth.uid()))
          or b.guide_id          = coalesce(target_user_id, (select auth.uid()))
          or public.user_has_role(coalesce(target_user_id, (select auth.uid())), 'admin'::public.app_role)
        )
    );
$$;

create or replace function public.can_access_conversation_thread(target_thread_id uuid, target_user_id uuid default null)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(target_user_id, (select auth.uid())) is not null
    and exists (
      select 1 from public.conversation_threads ct
      where ct.id = target_thread_id
        and (
          ct.created_by = coalesce(target_user_id, (select auth.uid()))
          or case ct.subject_type
            when 'request' then public.can_access_request_thread(ct.request_id, coalesce(target_user_id, (select auth.uid())))
            when 'offer'   then public.can_access_offer_thread(ct.offer_id,     coalesce(target_user_id, (select auth.uid())))
            when 'booking' then public.can_access_booking_thread(ct.booking_id, coalesce(target_user_id, (select auth.uid())))
            when 'dispute' then public.can_access_dispute_thread(ct.dispute_id, coalesce(target_user_id, (select auth.uid())))
            else false
          end
        )
    );
$$;

create or replace function public.can_create_conversation_thread(
  target_subject_type public.thread_subject,
  target_request_id   uuid,
  target_offer_id     uuid,
  target_booking_id   uuid,
  target_dispute_id   uuid,
  target_user_id      uuid default null
)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(target_user_id, (select auth.uid())) is not null
    and case target_subject_type
      when 'request' then public.can_access_request_thread(target_request_id, coalesce(target_user_id, (select auth.uid())))
      when 'offer'   then public.can_access_offer_thread(target_offer_id,     coalesce(target_user_id, (select auth.uid())))
      when 'booking' then public.can_access_booking_thread(target_booking_id, coalesce(target_user_id, (select auth.uid())))
      when 'dispute' then public.can_access_dispute_thread(target_dispute_id, coalesce(target_user_id, (select auth.uid())))
      else false
    end;
$$;

-- ---------------------------------------------------------------------------
-- RLS POLICIES
-- All auth.uid() calls wrapped in (select ...) — Supabase-recommended pattern
-- to evaluate once per query, not once per row.
-- All uuid comparisons are uuid = uuid; no text/uuid mixing.
-- ---------------------------------------------------------------------------

-- profiles
create policy "profiles_select" on public.profiles for select
  using ((select auth.uid()) = id or public.is_admin());
create policy "profiles_insert" on public.profiles for insert
  with check ((select auth.uid()) = id or public.is_admin());
create policy "profiles_update" on public.profiles for update
  using ((select auth.uid()) = id or public.is_admin());

-- guide_profiles
create policy "guide_profiles_select" on public.guide_profiles for select
  using (
    verification_status = 'approved'::public.guide_verification_status
    or ((select auth.uid()) is not null and (select auth.uid()) = user_id)
    or public.is_admin()
  );
create policy "guide_profiles_insert" on public.guide_profiles for insert
  with check (((select auth.uid()) is not null and (select auth.uid()) = user_id) or public.is_admin());
create policy "guide_profiles_update" on public.guide_profiles for update
  using (((select auth.uid()) is not null and (select auth.uid()) = user_id) or public.is_admin())
  with check (((select auth.uid()) is not null and (select auth.uid()) = user_id) or public.is_admin());

-- listings
create policy "listings_select" on public.listings for select
  using (status = 'published'::public.listing_status or (select auth.uid()) = guide_id or public.is_admin());
create policy "listings_insert" on public.listings for insert
  with check ((select auth.uid()) = guide_id or public.is_admin());
create policy "listings_update" on public.listings for update
  using ((select auth.uid()) = guide_id or public.is_admin());

-- traveler_requests
create policy "traveler_requests_select" on public.traveler_requests for select
  using (
    (select auth.uid()) = traveler_id
    or public.is_admin()
    or (status = 'open'::public.request_status and public.is_guide())
    or (status = 'open'::public.request_status and open_to_join = true)
  );
create policy "traveler_requests_insert" on public.traveler_requests for insert
  with check ((select auth.uid()) = traveler_id or public.is_admin());
create policy "traveler_requests_update" on public.traveler_requests for update
  using ((select auth.uid()) = traveler_id or public.is_admin());

-- open_request_members
create policy "open_request_members_select" on public.open_request_members for select
  using (
    (select auth.uid()) = traveler_id
    or public.is_admin()
    or exists (select 1 from public.traveler_requests tr where tr.id = request_id and tr.traveler_id = (select auth.uid()))
  );
create policy "open_request_members_insert" on public.open_request_members for insert
  with check ((select auth.uid()) = traveler_id or public.is_admin());
create policy "open_request_members_update" on public.open_request_members for update
  using (
    (select auth.uid()) = traveler_id
    or public.is_admin()
    or exists (select 1 from public.traveler_requests tr where tr.id = request_id and tr.traveler_id = (select auth.uid()))
  );

-- guide_offers
create policy "guide_offers_select" on public.guide_offers for select
  using (
    (select auth.uid()) = guide_id
    or public.is_admin()
    or exists (select 1 from public.traveler_requests tr where tr.id = request_id and tr.traveler_id = (select auth.uid()))
  );
create policy "guide_offers_insert" on public.guide_offers for insert
  with check ((select auth.uid()) = guide_id or public.is_admin());
create policy "guide_offers_update" on public.guide_offers for update
  using ((select auth.uid()) = guide_id or public.is_admin());

-- bookings
create policy "bookings_select" on public.bookings for select
  using ((select auth.uid()) = traveler_id or (select auth.uid()) = guide_id or public.is_admin());
create policy "bookings_insert" on public.bookings for insert
  with check ((select auth.uid()) = traveler_id or public.is_admin());
create policy "bookings_update" on public.bookings for update
  using ((select auth.uid()) = traveler_id or (select auth.uid()) = guide_id or public.is_admin());

-- reviews
create policy "reviews_select" on public.reviews for select
  using (status = 'published'::public.review_status or (select auth.uid()) = traveler_id or public.is_admin());
create policy "reviews_insert" on public.reviews for insert
  with check (
    (select auth.uid()) = traveler_id
    and exists (select 1 from public.bookings b where b.id = booking_id and b.status = 'completed'::public.booking_status)
    or public.is_admin()
  );
create policy "reviews_update" on public.reviews for update
  using ((select auth.uid()) = traveler_id or public.is_admin());

-- favorites
create policy "favorites_owner" on public.favorites for all
  using ((select auth.uid()) = user_id or public.is_admin());

-- notifications
create policy "notifications_owner" on public.notifications for all
  using ((select auth.uid()) = user_id or public.is_admin());

-- notification_deliveries
create policy "notification_deliveries_admin" on public.notification_deliveries for all
  using (public.is_admin());

-- disputes
create policy "disputes_select" on public.disputes for select
  using (
    (select auth.uid()) = opened_by
    or (select auth.uid()) = assigned_admin_id
    or public.is_admin()
    or exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (b.traveler_id = (select auth.uid()) or b.guide_id = (select auth.uid()))
    )
  );
create policy "disputes_insert" on public.disputes for insert
  with check (
    (
      (select auth.uid()) = opened_by
      and exists (
        select 1 from public.bookings b
        where b.id = booking_id
          and (b.traveler_id = (select auth.uid()) or b.guide_id = (select auth.uid()))
      )
    )
    or public.is_admin()
  );
create policy "disputes_update" on public.disputes for update
  using (public.is_admin());

-- dispute_notes
create policy "dispute_notes_select" on public.dispute_notes for select
  using (
    public.is_admin()
    or (
      internal_only = false
      and exists (
        select 1 from public.disputes d
        join public.bookings b on b.id = d.booking_id
        where d.id = dispute_id
          and (b.traveler_id = (select auth.uid()) or b.guide_id = (select auth.uid()))
      )
    )
  );
create policy "dispute_notes_write" on public.dispute_notes for insert
  with check (public.is_admin());
create policy "dispute_notes_update" on public.dispute_notes for update
  using (public.is_admin());

-- storage_assets
create policy "storage_assets_select" on public.storage_assets for select
  using ((select auth.uid()) = owner_id or public.is_admin());
create policy "storage_assets_insert" on public.storage_assets for insert
  with check ((select auth.uid()) = owner_id or public.is_admin());
create policy "storage_assets_update" on public.storage_assets for update
  using ((select auth.uid()) = owner_id or public.is_admin());

-- guide_documents
create policy "guide_documents_select" on public.guide_documents for select
  using ((select auth.uid()) = guide_id or public.is_admin());
create policy "guide_documents_insert" on public.guide_documents for insert
  with check ((select auth.uid()) = guide_id or public.is_admin());
create policy "guide_documents_update" on public.guide_documents for update
  using ((select auth.uid()) = guide_id or public.is_admin());

-- listing_media
create policy "listing_media_select" on public.listing_media for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.listings l
      where l.id = listing_id
        and (l.status = 'published'::public.listing_status or l.guide_id = (select auth.uid()))
    )
  );
create policy "listing_media_insert" on public.listing_media for insert
  with check (
    public.is_admin()
    or exists (select 1 from public.listings l where l.id = listing_id and l.guide_id = (select auth.uid()))
  );
create policy "listing_media_update" on public.listing_media for update
  using (
    public.is_admin()
    or exists (select 1 from public.listings l where l.id = listing_id and l.guide_id = (select auth.uid()))
  );

-- dispute_evidence
create policy "dispute_evidence_select" on public.dispute_evidence for select
  using (
    (select auth.uid()) = uploaded_by
    or public.is_admin()
    or exists (
      select 1 from public.disputes d
      join public.bookings b on b.id = d.booking_id
      where d.id = dispute_id
        and (b.traveler_id = (select auth.uid()) or b.guide_id = (select auth.uid()))
    )
  );
create policy "dispute_evidence_insert" on public.dispute_evidence for insert
  with check (
    (select auth.uid()) = uploaded_by
    and (
      public.is_admin()
      or exists (
        select 1 from public.disputes d
        join public.bookings b on b.id = d.booking_id
        where d.id = dispute_id
          and (b.traveler_id = (select auth.uid()) or b.guide_id = (select auth.uid()))
      )
    )
  );

-- conversation_threads
create policy "conversation_threads_select" on public.conversation_threads for select
  using (public.can_access_conversation_thread(id, (select auth.uid())));
create policy "conversation_threads_insert" on public.conversation_threads for insert
  with check (
    (
      (select auth.uid()) is not null
      and created_by = (select auth.uid())
      and public.can_create_conversation_thread(subject_type, request_id, offer_id, booking_id, dispute_id, (select auth.uid()))
    )
    or public.is_admin()
  );
create policy "conversation_threads_update" on public.conversation_threads for update
  using (public.is_admin());

-- thread_participants
create policy "thread_participants_select" on public.thread_participants for select
  using (public.can_access_conversation_thread(thread_id, (select auth.uid())));
create policy "thread_participants_insert" on public.thread_participants for insert
  with check (
    public.is_admin()
    or (
      (select auth.uid()) is not null
      and public.can_access_conversation_thread(thread_id, (select auth.uid()))
      and public.can_access_conversation_thread(thread_id, user_id)
    )
  );
create policy "thread_participants_update" on public.thread_participants for update
  using (((select auth.uid()) is not null and user_id = (select auth.uid())) or public.is_admin());

-- messages
create policy "messages_select" on public.messages for select
  using (public.can_access_conversation_thread(thread_id, (select auth.uid())));
create policy "messages_insert" on public.messages for insert
  with check (
    (
      (select auth.uid()) is not null
      and public.can_access_conversation_thread(thread_id, (select auth.uid()))
      and (sender_id is null or sender_id = (select auth.uid()))
    )
    or public.is_admin()
  );

-- marketplace_events
create policy "marketplace_events_select" on public.marketplace_events for select
  using (public.is_admin());
create policy "marketplace_events_insert" on public.marketplace_events for insert
  with check (public.is_admin() or (select auth.uid()) is not null);

-- moderation_cases
create policy "moderation_cases_admin" on public.moderation_cases for all
  using (public.is_admin());

-- moderation_actions
create policy "moderation_actions_admin" on public.moderation_actions for all
  using (public.is_admin());

-- quality_snapshots
create policy "quality_snapshots_public_read" on public.quality_snapshots for select
  using (true);
create policy "quality_snapshots_admin_write" on public.quality_snapshots for all
  using (public.is_admin());

-- destinations
create policy "destinations_public_read" on public.destinations for select
  using (true);
create policy "destinations_admin_write" on public.destinations for all
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- STORAGE BUCKETS
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('guide-media',      'guide-media',      false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf']),
  ('listing-media',    'listing-media',    true,  10485760, array['image/jpeg','image/png','image/webp']),
  ('dispute-evidence', 'dispute-evidence', false, 20971520, array['image/jpeg','image/png','image/webp','application/pdf','video/mp4'])
on conflict (id) do nothing;

-- Storage RLS
-- owner_id is uuid  → compare with auth.uid() (uuid = uuid, no cast needed)
-- path folder check → split_part(name, '/', 1) returns text; auth.uid()::text is text (text = text)
create policy "guide_media_select"        on storage.objects for select
  using  (bucket_id = 'guide-media' and (owner_id = (select auth.uid()) or public.is_admin()));
create policy "guide_media_insert"        on storage.objects for insert
  with check (bucket_id = 'guide-media' and split_part(name, '/', 1) = ((select auth.uid())::text));
create policy "guide_media_update"        on storage.objects for update
  using  (bucket_id = 'guide-media' and (owner_id = (select auth.uid()) or public.is_admin()));

create policy "listing_media_public_read" on storage.objects for select
  using  (bucket_id = 'listing-media');
create policy "listing_media_insert"      on storage.objects for insert
  with check (bucket_id = 'listing-media' and split_part(name, '/', 1) = ((select auth.uid())::text));
create policy "listing_media_update"      on storage.objects for update
  using  (bucket_id = 'listing-media' and (owner_id = (select auth.uid()) or public.is_admin()));

create policy "dispute_evidence_select"   on storage.objects for select
  using  (bucket_id = 'dispute-evidence' and (owner_id = (select auth.uid()) or public.is_admin()));
create policy "dispute_evidence_insert"   on storage.objects for insert
  with check (bucket_id = 'dispute-evidence' and split_part(name, '/', 1) = ((select auth.uid())::text));
create policy "dispute_evidence_update"   on storage.objects for update
  using  (bucket_id = 'dispute-evidence' and (owner_id = (select auth.uid()) or public.is_admin()));

-- ---------------------------------------------------------------------------
-- VIEWS
-- ---------------------------------------------------------------------------
create or replace view public.public_guide_stats as
select
  gp.user_id as guide_id,
  round(avg(r.rating)::numeric, 1)                                          as average_rating,
  count(distinct r.id)                                                       as reviews_count,
  count(distinct b.id) filter (where b.status = 'completed'::public.booking_status) as completed_bookings_count,
  count(distinct b.id) filter (where b.status = 'cancelled'::public.booking_status) as cancelled_bookings_count,
  count(distinct b.id) filter (where b.status in ('confirmed'::public.booking_status, 'pending'::public.booking_status)) as active_bookings_count
from public.guide_profiles gp
left join public.reviews  r on r.guide_id = gp.user_id and r.status = 'published'::public.review_status
left join public.bookings b on b.guide_id = gp.user_id
group by gp.user_id;

grant select on public.public_guide_stats to anon, authenticated;

create or replace view public.public_listing_stats as
select
  l.id as listing_id,
  round(avg(r.rating)::numeric, 1)                                        as average_rating,
  count(distinct r.id)                                                     as reviews_count,
  count(distinct b.id) filter (where b.status = 'completed'::public.booking_status) as completed_bookings_count
from public.listings l
left join public.reviews  r on r.listing_id = l.id and r.status = 'published'::public.review_status
left join public.bookings b on b.listing_id = l.id
group by l.id;

grant select on public.public_listing_stats to anon, authenticated;
