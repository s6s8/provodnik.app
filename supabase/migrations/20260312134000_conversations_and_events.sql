drop table if exists public.notification_deliveries cascade;
drop table if exists public.marketplace_events cascade;
drop table if exists public.messages cascade;
drop table if exists public.thread_participants cascade;
drop table if exists public.conversation_threads cascade;

drop function if exists public.touch_thread_updated_at() cascade;

drop type if exists public.event_scope cascade;
drop type if exists public.message_sender_role cascade;
drop type if exists public.thread_subject cascade;

create type public.thread_subject as enum ('request', 'offer', 'booking', 'dispute');
create type public.message_sender_role as enum ('traveler', 'guide', 'admin', 'system');
create type public.event_scope as enum ('request', 'booking', 'dispute', 'moderation');

create table public.conversation_threads (
  id uuid primary key default extensions.gen_random_uuid(),
  subject_type public.thread_subject not null,
  request_id uuid references public.traveler_requests (id) on delete cascade,
  offer_id uuid references public.guide_offers (id) on delete cascade,
  booking_id uuid references public.bookings (id) on delete cascade,
  dispute_id uuid references public.disputes (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint conversation_threads_subject_ref_check check (
    (subject_type = 'request' and request_id is not null and offer_id is null and booking_id is null and dispute_id is null) or
    (subject_type = 'offer' and offer_id is not null and request_id is null and booking_id is null and dispute_id is null) or
    (subject_type = 'booking' and booking_id is not null and request_id is null and offer_id is null and dispute_id is null) or
    (subject_type = 'dispute' and dispute_id is not null and request_id is null and offer_id is null and booking_id is null)
  )
);

create unique index conversation_threads_request_unique_idx
  on public.conversation_threads (request_id)
  where request_id is not null;

create unique index conversation_threads_offer_unique_idx
  on public.conversation_threads (offer_id)
  where offer_id is not null;

create unique index conversation_threads_booking_unique_idx
  on public.conversation_threads (booking_id)
  where booking_id is not null;

create unique index conversation_threads_dispute_unique_idx
  on public.conversation_threads (dispute_id)
  where dispute_id is not null;

create table public.thread_participants (
  thread_id uuid not null references public.conversation_threads (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default timezone('utc', now()),
  last_read_at timestamptz,
  primary key (thread_id, user_id)
);

create table public.messages (
  id uuid primary key default extensions.gen_random_uuid(),
  thread_id uuid not null references public.conversation_threads (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete set null,
  sender_role public.message_sender_role not null,
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.marketplace_events (
  id uuid primary key default extensions.gen_random_uuid(),
  scope public.event_scope not null,
  request_id uuid references public.traveler_requests (id) on delete cascade,
  booking_id uuid references public.bookings (id) on delete cascade,
  dispute_id uuid references public.disputes (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  event_type text not null,
  summary text not null,
  detail text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint marketplace_events_scope_ref_check check (
    (scope = 'request' and request_id is not null and booking_id is null and dispute_id is null) or
    (scope = 'booking' and booking_id is not null and request_id is null and dispute_id is null) or
    (scope = 'dispute' and dispute_id is not null and request_id is null and booking_id is null) or
    (scope = 'moderation' and dispute_id is null)
  )
);

create table public.notification_deliveries (
  id uuid primary key default extensions.gen_random_uuid(),
  notification_id uuid not null references public.notifications (id) on delete cascade,
  channel text not null,
  status text not null default 'pending',
  provider_message_id text,
  attempted_at timestamptz,
  delivered_at timestamptz,
  error_message text,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.touch_thread_updated_at()
returns trigger
language plpgsql
as $$
begin
  update public.conversation_threads
  set updated_at = timezone('utc', now())
  where id = new.thread_id;

  return new;
end;
$$;

create index conversation_threads_subject_idx
  on public.conversation_threads (subject_type, updated_at desc);

create index thread_participants_user_idx
  on public.thread_participants (user_id, last_read_at);

create index messages_thread_created_idx
  on public.messages (thread_id, created_at);

create index marketplace_events_request_idx
  on public.marketplace_events (request_id, created_at desc);

create index marketplace_events_booking_idx
  on public.marketplace_events (booking_id, created_at desc);

create index marketplace_events_dispute_idx
  on public.marketplace_events (dispute_id, created_at desc);

create index notification_deliveries_notification_idx
  on public.notification_deliveries (notification_id, created_at desc);

create trigger set_conversation_threads_updated_at
  before update on public.conversation_threads
  for each row execute procedure public.set_updated_at();

create trigger touch_thread_on_message_insert
  after insert on public.messages
  for each row execute procedure public.touch_thread_updated_at();

alter table public.conversation_threads enable row level security;
alter table public.thread_participants enable row level security;
alter table public.messages enable row level security;
alter table public.marketplace_events enable row level security;
alter table public.notification_deliveries enable row level security;

create policy "conversation_threads_select_participant_or_admin"
  on public.conversation_threads for select
  using (
    public.is_admin()
    or exists (
      select 1
      from public.thread_participants tp
      where tp.thread_id = id and tp.user_id = auth.uid()
    )
  );

create policy "conversation_threads_insert_related_or_admin"
  on public.conversation_threads for insert
  with check (
    public.is_admin()
    or created_by = auth.uid()
  );

create policy "conversation_threads_update_admin_only"
  on public.conversation_threads for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "thread_participants_select_self_or_admin"
  on public.thread_participants for select
  using (user_id = auth.uid() or public.is_admin());

create policy "thread_participants_insert_admin_only"
  on public.thread_participants for insert
  with check (public.is_admin());

create policy "thread_participants_update_self_or_admin"
  on public.thread_participants for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "messages_select_participant_or_admin"
  on public.messages for select
  using (
    public.is_admin()
    or exists (
      select 1
      from public.thread_participants tp
      where tp.thread_id = thread_id and tp.user_id = auth.uid()
    )
  );

create policy "messages_insert_participant_or_admin"
  on public.messages for insert
  with check (
    public.is_admin()
    or exists (
      select 1
      from public.thread_participants tp
      where tp.thread_id = thread_id and tp.user_id = auth.uid()
    )
  );

create policy "marketplace_events_select_related_or_admin"
  on public.marketplace_events for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.traveler_requests tr
      where tr.id = request_id and (tr.traveler_id = auth.uid() or public.is_guide())
    )
    or exists (
      select 1 from public.bookings b
      where b.id = booking_id and (b.traveler_id = auth.uid() or b.guide_id = auth.uid())
    )
    or exists (
      select 1
      from public.disputes d
      join public.bookings b on b.id = d.booking_id
      where d.id = dispute_id and (b.traveler_id = auth.uid() or b.guide_id = auth.uid())
    )
  );

create policy "marketplace_events_insert_admin_only"
  on public.marketplace_events for insert
  with check (public.is_admin());

create policy "notification_deliveries_admin_only"
  on public.notification_deliveries for all
  using (public.is_admin())
  with check (public.is_admin());
