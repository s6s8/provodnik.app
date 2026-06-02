-- Fix custom_access_token_hook to match Supabase auth-hooks contract (AP-038).
-- The previous one-shot jsonb_set on '{claims,app_metadata,role}' broke token issuance
-- ("Database error querying schema") for accounts that hit the hook on sign-in.

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  claims jsonb;
  user_role public.app_role;
begin
  select p.role
    into user_role
    from public.profiles as p
   where p.id = (event->>'user_id')::uuid;

  claims := coalesce(event->'claims', '{}'::jsonb);

  if user_role is not null then
    claims := jsonb_set(
      claims,
      '{app_metadata}',
      coalesce(claims->'app_metadata', '{}'::jsonb)
        || jsonb_build_object('role', user_role::text)
    );
  end if;

  return jsonb_set(coalesce(event, '{}'::jsonb), '{claims}', claims);
end;
$$;

grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb)
  from authenticated, anon, public;

drop policy if exists "profiles_select_auth_admin_hook" on public.profiles;
create policy "profiles_select_auth_admin_hook"
  on public.profiles
  for select
  to supabase_auth_admin
  using (true);
