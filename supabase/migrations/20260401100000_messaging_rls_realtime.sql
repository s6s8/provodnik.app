do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end
$$;

create or replace function public.is_thread_participant(p_thread_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.thread_participants
    where thread_id = p_thread_id
      and user_id = (select auth.uid())
  );
$$;

drop policy if exists "conversation_threads_select" on public.conversation_threads;
drop policy if exists "conversation_threads_select_participant_or_admin" on public.conversation_threads;

create policy "conversation_threads_select"
  on public.conversation_threads
  for select
  using (
    public.is_admin()
    or public.is_thread_participant(id)
  );

drop policy if exists "thread_participants_select" on public.thread_participants;
drop policy if exists "thread_participants_select_self_or_admin" on public.thread_participants;
drop policy if exists "thread_participants_select_thread_scope_or_admin" on public.thread_participants;
drop policy if exists "thread_participants_update" on public.thread_participants;
drop policy if exists "thread_participants_update_self_or_admin" on public.thread_participants;

create policy "thread_participants_select"
  on public.thread_participants
  for select
  using (
    public.is_admin()
    or public.is_thread_participant(thread_id)
  );

create policy "thread_participants_update"
  on public.thread_participants
  for update
  using (
    public.is_admin()
    or (
      (select auth.uid()) is not null
      and user_id = (select auth.uid())
      and public.is_thread_participant(thread_id)
    )
  )
  with check (
    public.is_admin()
    or (
      (select auth.uid()) is not null
      and user_id = (select auth.uid())
      and public.is_thread_participant(thread_id)
    )
  );

drop policy if exists "messages_select" on public.messages;
drop policy if exists "messages_insert" on public.messages;

create policy "messages_select"
  on public.messages
  for select
  using (
    public.is_admin()
    or public.is_thread_participant(thread_id)
  );

create policy "messages_insert"
  on public.messages
  for insert
  with check (
    (select auth.uid()) is not null
    and sender_id = (select auth.uid())
    and public.is_thread_participant(thread_id)
  );
