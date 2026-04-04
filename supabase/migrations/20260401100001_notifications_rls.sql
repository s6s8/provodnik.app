drop policy if exists "notifications_owner" on public.notifications;
drop policy if exists "notifications_owner_only" on public.notifications;

create policy "notifications_select_own"
  on public.notifications
  for select
  using ((select auth.uid()::uuid) = user_id);

create policy "notifications_select_admin"
  on public.notifications
  for select
  using (public.is_admin());

create policy "notifications_update_own"
  on public.notifications
  for update
  using ((select auth.uid()::uuid) = user_id)
  with check ((select auth.uid()::uuid) = user_id);
