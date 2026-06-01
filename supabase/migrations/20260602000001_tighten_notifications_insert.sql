-- Close notification-spoofing vector found in cycle audit 2026-06-02.
-- Was: with_check (is_admin() OR auth.uid() IS NOT NULL) — allowed any authed
-- user to insert notifications for arbitrary user_id via direct PostgREST.
-- App writes go through the service-role admin client (RLS-bypass), so
-- constraining to self-or-admin is safe.
drop policy if exists notifications_insert on public.notifications;
create policy notifications_insert on public.notifications
  for insert to public
  with check (public.is_admin() OR ((select auth.uid()) = user_id));
