-- 20260701120000_admin_user_management.sql
-- Admin User Management Console v1.
--
-- Additive, backward-compatible foundation for the /admin/users console:
--   1. `account_status` lifecycle enum + columns on profiles (default 'active');
--   2. `profile_account_status_for()` helper mirroring `profile_role_for()`;
--   3. extend the `profiles_update` WITH CHECK guard so `account_status` is
--      frozen for ordinary UPDATEs (the existing role guard is preserved) — only
--      the SECURITY DEFINER RPC below or a service-role client may change it;
--   4. `admin_audit_log` append-only table + RLS (admins read; no UPDATE/DELETE);
--   5. `admin_set_account_status()` — a transactional, guarded RPC that changes a
--      user's status and writes its own audit row atomically, enforcing the
--      self / last-active-admin safety rules at the database boundary.
--
-- Everything here is additive: existing rows get account_status='active', and no
-- existing column, policy, or function signature is dropped in a breaking way.

-- 1. Lifecycle enum ---------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'account_status') then
    create type public.account_status as enum ('active', 'suspended', 'archived');
  end if;
end $$;

-- 2. Profiles lifecycle columns --------------------------------------------
alter table public.profiles
  add column if not exists account_status public.account_status not null default 'active',
  add column if not exists status_reason text,
  add column if not exists status_changed_at timestamptz,
  add column if not exists status_changed_by uuid references public.profiles(id) on delete set null;

comment on column public.profiles.account_status is
  'Account lifecycle: active | suspended | archived. Suspended/archived users keep their data but are blocked from acting. Defaults to active.';

-- Keep admin RLS tied to lifecycle status too: a suspended/archived admin must
-- not continue to pass admin-only policies just because role='admin'.
create or replace function public.current_profile_role()
returns public.app_role language sql security definer stable set search_path = public as $$
  select role from public.profiles
   where id = (select auth.uid()::uuid)
     and account_status = 'active'::public.account_status;
$$;

create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles
     where id = (select auth.uid()::uuid)
       and role = 'admin'::public.app_role
       and account_status = 'active'::public.account_status
  );
$$;

-- 3. Current-stored-status helper (mirrors profile_role_for) ----------------
create or replace function public.profile_account_status_for(target_user_id uuid)
returns public.account_status
language sql
stable
security definer
set search_path = public
as $$
  select account_status from public.profiles where id = target_user_id;
$$;

-- 4. Freeze account_status for ordinary UPDATEs -----------------------------
--    Recreate profiles_update with the SAME role guard plus an account_status
--    guard. Privileged status changes must go through admin_set_account_status
--    (SECURITY DEFINER) or a service-role client, never a direct client UPDATE.
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update
  using (((select auth.uid()) = id) or is_admin())
  with check (
    (((select auth.uid()) = id) or is_admin())
    and role = profile_role_for(id)
    and account_status = profile_account_status_for(id)
  );

-- 5. Append-only admin audit log -------------------------------------------
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text not null default 'user',
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.admin_audit_log is
  'Append-only trail of privileged admin actions. Never store raw PII (phone/email/token) in metadata (PII-012).';

create index if not exists admin_audit_log_target_idx on public.admin_audit_log (target_id, created_at desc);
create index if not exists admin_audit_log_created_idx on public.admin_audit_log (created_at desc);

alter table public.admin_audit_log enable row level security;

drop policy if exists admin_audit_log_select on public.admin_audit_log;
create policy admin_audit_log_select on public.admin_audit_log
  for select using (is_admin());

drop policy if exists admin_audit_log_insert on public.admin_audit_log;
create policy admin_audit_log_insert on public.admin_audit_log
  for insert with check (is_admin() and actor_id = (select auth.uid()));

-- No UPDATE or DELETE policy: with RLS enabled and no matching policy, both are
-- denied for every non-owner role. The log is append-only by construction.

-- 6. Transactional, guarded status-change RPC ------------------------------
create or replace function public.admin_set_account_status(
  p_target_user_id uuid,
  p_status public.account_status,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor       uuid := (select auth.uid());
  v_current     public.account_status;
  v_target_role public.app_role;
  v_reason      text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if not is_admin() then
    raise exception 'forbidden: admin role required';
  end if;

  if p_target_user_id = v_actor then
    raise exception 'forbidden: administrators cannot change their own account status';
  end if;

  select account_status, role into v_current, v_target_role
    from public.profiles where id = p_target_user_id;

  if v_current is null then
    raise exception 'not_found: target user does not exist';
  end if;

  if v_current = p_status then
    raise exception 'noop: account is already in the requested status';
  end if;

  -- Last-active-admin guard: never suspend/archive the final active admin.
  if v_target_role = 'admin' and p_status <> 'active' then
    if (
      select count(*) from public.profiles
       where role = 'admin' and account_status = 'active' and id <> p_target_user_id
    ) = 0 then
      raise exception 'forbidden: cannot suspend or archive the last active administrator';
    end if;
  end if;

  update public.profiles
     set account_status    = p_status,
         status_reason     = v_reason,
         status_changed_at = now(),
         status_changed_by = v_actor,
         updated_at        = now()
   where id = p_target_user_id;

  insert into public.admin_audit_log (actor_id, action, target_type, target_id, metadata)
  values (
    v_actor,
    'account_status.' || p_status::text,
    'user',
    p_target_user_id,
    jsonb_build_object('from', v_current::text, 'to', p_status::text, 'reason', v_reason)
  );
end;
$$;

revoke all on function public.admin_set_account_status(uuid, public.account_status, text) from public;
grant execute on function public.admin_set_account_status(uuid, public.account_status, text) to authenticated;
