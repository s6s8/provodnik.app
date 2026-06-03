-- P1-2: Scope request-thread access to relationship (offer / eligibility), not guide role.
-- Restore canonical can_access_conversation_thread on base SELECT policies and drop
-- compensating stacked policies added after messaging_rls_realtime.sql.

drop function if exists public.can_access_request_thread(uuid, uuid);

create or replace function public.can_access_request_thread(target_request_id uuid, target_user_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(target_user_id, (select auth.uid()::uuid)) is not null
    and exists (
      select 1
        from public.traveler_requests tr
       where tr.id = target_request_id
         and (
           tr.traveler_id = coalesce(target_user_id, (select auth.uid()::uuid))
           or public.user_has_role(
             coalesce(target_user_id, (select auth.uid()::uuid)),
             'admin'::public.app_role
           )
           or exists (
             select 1
               from public.guide_offers go
              where go.request_id = tr.id
                and go.guide_id = coalesce(target_user_id, (select auth.uid()::uuid))
           )
           or exists (
             select 1
               from public.request_views rv
              where rv.request_id = tr.id
                and rv.guide_id = coalesce(target_user_id, (select auth.uid()::uuid))
           )
         )
    );
$$;

drop policy if exists "conversation_threads_select" on public.conversation_threads;
drop policy if exists "conversation_threads_select_participant_or_admin" on public.conversation_threads;

create policy "conversation_threads_select"
  on public.conversation_threads
  for select
  using (public.can_access_conversation_thread(id, (select auth.uid()::uuid)));

drop policy if exists "thread_participants_select" on public.thread_participants;
drop policy if exists "thread_participants_select_self_or_admin" on public.thread_participants;
drop policy if exists "thread_participants_select_thread_scope_or_admin" on public.thread_participants;

create policy "thread_participants_select"
  on public.thread_participants
  for select
  using (public.can_access_conversation_thread(thread_id, (select auth.uid()::uuid)));

drop policy if exists "messages_select" on public.messages;

create policy "messages_select"
  on public.messages
  for select
  using (public.can_access_conversation_thread(thread_id, (select auth.uid()::uuid)));

drop policy if exists "traveler_select_booking_thread" on public.conversation_threads;
drop policy if exists "traveler_select_booking_messages" on public.messages;
drop policy if exists "guide_select_booking_thread" on public.conversation_threads;
drop policy if exists "guide_select_booking_messages" on public.messages;
drop policy if exists "select_offer_thread_via_helper" on public.conversation_threads;
drop policy if exists "select_offer_thread_messages_via_helper" on public.messages;
