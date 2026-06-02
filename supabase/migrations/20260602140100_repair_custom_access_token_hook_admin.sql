-- Repair custom_access_token_hook after 20260602130000 (95c29cf).
-- coalesce(event->'claims'->'app_metadata', '{}') does not replace JSON null, so
-- null || jsonb_build_object('role', …) could leave app_metadata null and break JWT issuance
-- for seed/admin accounts while signup-created users (object app_metadata) still work.

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  claims jsonb;
  user_role text;
begin
  select p.role::text
    into user_role
    from public.profiles as p
   where p.id = (event->>'user_id')::uuid;

  claims := coalesce(event->'claims', '{}'::jsonb);

  if user_role is not null then
    if jsonb_typeof(claims->'app_metadata') is distinct from 'object' then
      claims := jsonb_set(claims, '{app_metadata}', '{}'::jsonb, true);
    end if;

    claims := jsonb_set(
      claims,
      '{app_metadata,role}',
      to_jsonb(user_role),
      true
    );
  end if;

  return jsonb_set(coalesce(event, '{}'::jsonb), '{claims}', claims, true);
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant select on table public.profiles to supabase_auth_admin;

grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook
  from authenticated, anon, public;

drop policy if exists "profiles_select_auth_admin_hook" on public.profiles;
create policy "profiles_select_auth_admin_hook"
  on public.profiles
  for select
  to supabase_auth_admin
  using (true);

-- GoTrue cannot scan NULL token columns on some seeded/admin rows (supabase/auth#1940).
update auth.users as u
set
  confirmation_token = coalesce(u.confirmation_token, ''),
  recovery_token = coalesce(u.recovery_token, ''),
  email_change_token_new = coalesce(u.email_change_token_new, ''),
  email_change = coalesce(u.email_change, '')
where lower(trim(u.email)) in ('admin@provodnik.app', 'admin@provodnik.test');
