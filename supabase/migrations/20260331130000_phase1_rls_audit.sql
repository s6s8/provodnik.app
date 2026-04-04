begin;

alter table public.guide_profiles
  add column if not exists is_available boolean not null default false;

create index if not exists guide_profiles_is_available_idx
  on public.guide_profiles (is_available, verification_status);

alter table public.profiles enable row level security;
alter table public.guide_profiles enable row level security;
alter table public.listings enable row level security;
alter table public.traveler_requests enable row level security;
alter table public.guide_offers enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.conversation_threads enable row level security;
alter table public.thread_participants enable row level security;
alter table public.messages enable row level security;
alter table public.disputes enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_insert_self" on public.profiles;
drop policy if exists "profiles_insert_self_or_admin" on public.profiles;
drop policy if exists "profiles_update_own_or_admin" on public.profiles;

create policy "profiles_select_own_or_admin"
  on public.profiles
  for select
  using (
    (auth.uid() is not null and auth.uid() = id)
    or public.is_admin()
  );

create policy "profiles_insert_self_or_admin"
  on public.profiles
  for insert
  with check (
    (auth.uid() is not null and auth.uid() = id)
    or public.is_admin()
  );

create policy "profiles_update_own_or_admin"
  on public.profiles
  for update
  using (
    (auth.uid() is not null and auth.uid() = id)
    or public.is_admin()
  )
  with check (
    (auth.uid() is not null and auth.uid() = id)
    or public.is_admin()
  );

drop policy if exists "guide_profiles_public_read_published" on public.guide_profiles;
drop policy if exists "guide_profiles_select_public_or_owner_or_admin" on public.guide_profiles;
drop policy if exists "guide_profiles_insert_owner_or_admin" on public.guide_profiles;
drop policy if exists "guide_profiles_update_owner_or_admin" on public.guide_profiles;

create policy "guide_profiles_select_public_or_owner_or_admin"
  on public.guide_profiles
  for select
  using (
    verification_status = 'approved'
    or (auth.uid() is not null and auth.uid() = user_id)
    or public.is_admin()
  );

create policy "guide_profiles_insert_owner_or_admin"
  on public.guide_profiles
  for insert
  with check (
    (auth.uid() is not null and auth.uid() = user_id)
    or public.is_admin()
  );

create policy "guide_profiles_update_owner_or_admin"
  on public.guide_profiles
  for update
  using (
    (auth.uid() is not null and auth.uid() = user_id)
    or public.is_admin()
  )
  with check (
    (auth.uid() is not null and auth.uid() = user_id)
    or public.is_admin()
  );

drop policy if exists "listings_public_read_published" on public.listings;
drop policy if exists "listings_insert_guide_or_admin" on public.listings;
drop policy if exists "listings_update_guide_or_admin" on public.listings;

create policy "listings_public_read_published"
  on public.listings
  for select
  using (
    status = 'published'
    or (auth.uid() is not null and guide_id = auth.uid())
    or public.is_admin()
  );

create policy "listings_insert_guide_or_admin"
  on public.listings
  for insert
  with check (
    (auth.uid() is not null and guide_id = auth.uid())
    or public.is_admin()
  );

create policy "listings_update_guide_or_admin"
  on public.listings
  for update
  using (
    (auth.uid() is not null and guide_id = auth.uid())
    or public.is_admin()
  )
  with check (
    (auth.uid() is not null and guide_id = auth.uid())
    or public.is_admin()
  );

drop policy if exists "traveler_requests_select_owner_joinable_guide_or_admin" on public.traveler_requests;
drop policy if exists "traveler_requests_insert_owner_or_admin" on public.traveler_requests;
drop policy if exists "traveler_requests_update_owner_or_admin" on public.traveler_requests;

create policy "traveler_requests_select_owner_joinable_guide_or_admin"
  on public.traveler_requests
  for select
  using (
    (auth.uid() is not null and traveler_id = auth.uid())
    or public.is_admin()
    or (public.is_guide() and status = 'open')
    or (auth.uid() is not null and open_to_join and status = 'open')
  );

create policy "traveler_requests_insert_owner_or_admin"
  on public.traveler_requests
  for insert
  with check (
    (auth.uid() is not null and traveler_id = auth.uid())
    or public.is_admin()
  );

create policy "traveler_requests_update_owner_or_admin"
  on public.traveler_requests
  for update
  using (
    (auth.uid() is not null and traveler_id = auth.uid())
    or public.is_admin()
  )
  with check (
    (auth.uid() is not null and traveler_id = auth.uid())
    or public.is_admin()
  );

drop policy if exists "guide_offers_select_related_users" on public.guide_offers;
drop policy if exists "guide_offers_insert_guide_or_admin" on public.guide_offers;
drop policy if exists "guide_offers_update_guide_or_admin" on public.guide_offers;

create policy "guide_offers_select_related_users"
  on public.guide_offers
  for select
  using (
    (auth.uid() is not null and guide_id = auth.uid())
    or public.is_admin()
    or exists (
      select 1
      from public.traveler_requests tr
      where tr.id = guide_offers.request_id
        and tr.traveler_id = auth.uid()
    )
  );

create policy "guide_offers_insert_guide_or_admin"
  on public.guide_offers
  for insert
  with check (
    (
      (auth.uid() is not null and guide_id = auth.uid())
      or public.is_admin()
    )
    and exists (
      select 1
      from public.traveler_requests tr
      where tr.id = guide_offers.request_id
    )
  );

create policy "guide_offers_update_guide_or_admin"
  on public.guide_offers
  for update
  using (
    (auth.uid() is not null and guide_id = auth.uid())
    or public.is_admin()
  )
  with check (
    (auth.uid() is not null and guide_id = auth.uid())
    or public.is_admin()
  );

drop policy if exists "bookings_select_related_users" on public.bookings;
drop policy if exists "bookings_insert_traveler_or_admin" on public.bookings;
drop policy if exists "bookings_update_related_users" on public.bookings;

create policy "bookings_select_related_users"
  on public.bookings
  for select
  using (
    (auth.uid() is not null and traveler_id = auth.uid())
    or (auth.uid() is not null and guide_id = auth.uid())
    or public.is_admin()
  );

create policy "bookings_insert_traveler_or_admin"
  on public.bookings
  for insert
  with check (
    (auth.uid() is not null and traveler_id = auth.uid())
    or public.is_admin()
  );

create policy "bookings_update_related_users"
  on public.bookings
  for update
  using (
    (auth.uid() is not null and traveler_id = auth.uid())
    or (auth.uid() is not null and guide_id = auth.uid())
    or public.is_admin()
  )
  with check (
    (auth.uid() is not null and traveler_id = auth.uid())
    or (auth.uid() is not null and guide_id = auth.uid())
    or public.is_admin()
  );

drop policy if exists "reviews_public_read_published" on public.reviews;
drop policy if exists "reviews_insert_completed_booking_owner" on public.reviews;
drop policy if exists "reviews_update_owner_or_admin" on public.reviews;

create policy "reviews_public_read_published"
  on public.reviews
  for select
  using (
    status = 'published'
    or (auth.uid() is not null and traveler_id = auth.uid())
    or (auth.uid() is not null and guide_id = auth.uid())
    or public.is_admin()
  );

create policy "reviews_insert_completed_booking_owner"
  on public.reviews
  for insert
  with check (
    auth.uid() is not null
    and traveler_id = auth.uid()
    and exists (
      select 1
      from public.bookings b
      where b.id = reviews.booking_id
        and b.traveler_id = auth.uid()
        and b.status = 'completed'
    )
  );

create policy "reviews_update_owner_or_admin"
  on public.reviews
  for update
  using (
    (auth.uid() is not null and traveler_id = auth.uid())
    or public.is_admin()
  )
  with check (
    (auth.uid() is not null and traveler_id = auth.uid())
    or public.is_admin()
  );

drop policy if exists "notifications_owner_only" on public.notifications;

create policy "notifications_owner_only"
  on public.notifications
  for all
  using (
    (auth.uid() is not null and user_id = auth.uid())
    or public.is_admin()
  )
  with check (
    (auth.uid() is not null and user_id = auth.uid())
    or public.is_admin()
  );

drop policy if exists "conversation_threads_select_participant_or_admin" on public.conversation_threads;
drop policy if exists "conversation_threads_insert_related_or_admin" on public.conversation_threads;
drop policy if exists "conversation_threads_insert_creator_or_admin" on public.conversation_threads;
drop policy if exists "conversation_threads_update_admin_only" on public.conversation_threads;

create policy "conversation_threads_select_participant_or_admin"
  on public.conversation_threads
  for select
  using (
    public.is_admin()
    or exists (
      select 1
      from public.thread_participants tp
      where tp.thread_id = conversation_threads.id
        and tp.user_id = auth.uid()
    )
  );

create policy "conversation_threads_insert_creator_or_admin"
  on public.conversation_threads
  for insert
  with check (
    (auth.uid() is not null and created_by = auth.uid())
    or public.is_admin()
  );

create policy "conversation_threads_update_admin_only"
  on public.conversation_threads
  for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "thread_participants_select_self_or_admin" on public.thread_participants;
drop policy if exists "thread_participants_select_thread_scope_or_admin" on public.thread_participants;
drop policy if exists "thread_participants_insert_admin_only" on public.thread_participants;
drop policy if exists "thread_participants_update_self_or_admin" on public.thread_participants;

create policy "thread_participants_select_thread_scope_or_admin"
  on public.thread_participants
  for select
  using (
    (auth.uid() is not null and user_id = auth.uid())
    or public.is_admin()
    or exists (
      select 1
      from public.thread_participants current_participant
      where current_participant.thread_id = thread_participants.thread_id
        and current_participant.user_id = auth.uid()
    )
  );

create policy "thread_participants_insert_admin_only"
  on public.thread_participants
  for insert
  with check (public.is_admin());

create policy "thread_participants_update_self_or_admin"
  on public.thread_participants
  for update
  using (
    (auth.uid() is not null and user_id = auth.uid())
    or public.is_admin()
  )
  with check (
    (auth.uid() is not null and user_id = auth.uid())
    or public.is_admin()
  );

drop policy if exists "messages_select_participant_or_admin" on public.messages;
drop policy if exists "messages_insert_participant_or_admin" on public.messages;

create policy "messages_select_participant_or_admin"
  on public.messages
  for select
  using (
    public.is_admin()
    or exists (
      select 1
      from public.thread_participants tp
      where tp.thread_id = messages.thread_id
        and tp.user_id = auth.uid()
    )
  );

create policy "messages_insert_participant_or_admin"
  on public.messages
  for insert
  with check (
    public.is_admin()
    or exists (
      select 1
      from public.thread_participants tp
      where tp.thread_id = messages.thread_id
        and tp.user_id = auth.uid()
    )
  );

drop policy if exists "disputes_select_related_users" on public.disputes;
drop policy if exists "disputes_insert_related_booking_user" on public.disputes;
drop policy if exists "disputes_update_admin_only" on public.disputes;

create policy "disputes_select_related_users"
  on public.disputes
  for select
  using (
    (auth.uid() is not null and opened_by = auth.uid())
    or (auth.uid() is not null and assigned_admin_id = auth.uid())
    or public.is_admin()
    or exists (
      select 1
      from public.bookings b
      where b.id = disputes.booking_id
        and (
          b.traveler_id = auth.uid()
          or b.guide_id = auth.uid()
        )
    )
  );

create policy "disputes_insert_related_booking_user"
  on public.disputes
  for insert
  with check (
    auth.uid() is not null
    and opened_by = auth.uid()
    and exists (
      select 1
      from public.bookings b
      where b.id = disputes.booking_id
        and (
          b.traveler_id = auth.uid()
          or b.guide_id = auth.uid()
          or public.is_admin()
        )
    )
  );

create policy "disputes_update_admin_only"
  on public.disputes
  for update
  using (public.is_admin())
  with check (public.is_admin());

commit;
