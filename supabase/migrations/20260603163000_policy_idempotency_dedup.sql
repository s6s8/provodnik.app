-- Forward-only policy cleanup for audited idempotency and duplicate-policy drift.

drop policy if exists "notifications_owner" on public.notifications;
drop policy if exists "notifications_owner_only" on public.notifications;
drop policy if exists "notifications_select_own" on public.notifications;
drop policy if exists "notifications_select_admin" on public.notifications;
drop policy if exists "notifications_update_own" on public.notifications;
drop policy if exists "notifications_select" on public.notifications;
drop policy if exists "notifications_insert" on public.notifications;
drop policy if exists "notifications_update" on public.notifications;
drop policy if exists "notifications_delete" on public.notifications;

create policy "notifications_select"
  on public.notifications
  for select
  using ((select auth.uid()::uuid) = user_id or public.is_admin());

create policy "notifications_insert"
  on public.notifications
  for insert
  with check (public.is_admin() or (select auth.uid()::uuid) = user_id);

create policy "notifications_update"
  on public.notifications
  for update
  using ((select auth.uid()::uuid) = user_id or public.is_admin())
  with check ((select auth.uid()::uuid) = user_id or public.is_admin());

create policy "notifications_delete"
  on public.notifications
  for delete
  using (public.is_admin());

drop policy if exists "listings_update" on public.listings;
create policy "listings_update"
  on public.listings
  for update
  using ((select auth.uid()::uuid) = guide_id or public.is_admin())
  with check ((select auth.uid()::uuid) = guide_id or public.is_admin());

drop policy if exists "traveler_requests_update" on public.traveler_requests;
create policy "traveler_requests_update"
  on public.traveler_requests
  for update
  using ((select auth.uid()::uuid) = traveler_id or public.is_admin())
  with check ((select auth.uid()::uuid) = traveler_id or public.is_admin());

drop policy if exists "open_request_members_update" on public.open_request_members;
create policy "open_request_members_update"
  on public.open_request_members
  for update
  using (
    (select auth.uid()::uuid) = traveler_id
    or public.is_admin()
    or exists (
      select 1
      from public.traveler_requests tr
      where tr.id = request_id
        and tr.traveler_id = (select auth.uid()::uuid)
    )
  )
  with check (
    (select auth.uid()::uuid) = traveler_id
    or public.is_admin()
    or exists (
      select 1
      from public.traveler_requests tr
      where tr.id = request_id
        and tr.traveler_id = (select auth.uid()::uuid)
    )
  );

drop policy if exists "guide_offers_update" on public.guide_offers;
create policy "guide_offers_update"
  on public.guide_offers
  for update
  using ((select auth.uid()::uuid) = guide_id or public.is_admin())
  with check ((select auth.uid()::uuid) = guide_id or public.is_admin());

drop policy if exists "bookings_update" on public.bookings;
create policy "bookings_update"
  on public.bookings
  for update
  using (
    (select auth.uid()::uuid) = traveler_id
    or (select auth.uid()::uuid) = guide_id
    or public.is_admin()
  )
  with check (
    (select auth.uid()::uuid) = traveler_id
    or (select auth.uid()::uuid) = guide_id
    or public.is_admin()
  );

drop policy if exists "reviews_update" on public.reviews;
create policy "reviews_update"
  on public.reviews
  for update
  using ((select auth.uid()::uuid) = traveler_id or public.is_admin())
  with check ((select auth.uid()::uuid) = traveler_id or public.is_admin());

drop policy if exists "review_replies_update" on public.review_replies;
create policy "review_replies_update"
  on public.review_replies
  for update
  using ((select auth.uid()) = guide_id or public.is_admin())
  with check ((select auth.uid()) = guide_id or public.is_admin());

drop policy if exists "Users upload own files" on storage.objects;
create policy "Users upload own files" on storage.objects for insert
  with check (
    bucket_id in ('guide-avatars', 'guide-documents', 'listing-media', 'dispute-evidence')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Public buckets readable" on storage.objects;
create policy "Public buckets readable" on storage.objects for select
  using (bucket_id in ('guide-avatars', 'listing-media'));

drop policy if exists "Private files visible to owner" on storage.objects;
create policy "Private files visible to owner" on storage.objects for select
  using (
    bucket_id in ('guide-documents', 'dispute-evidence')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Admins see all files" on storage.objects;
create policy "Admins see all files" on storage.objects for select
  using ((select public.is_admin()));

drop policy if exists "traveler_select_booking_thread" on public.conversation_threads;
drop policy if exists "traveler_select_booking_messages" on public.messages;
