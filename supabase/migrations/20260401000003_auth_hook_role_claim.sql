-- Grant supabase_auth_admin access to read profiles for the hook
grant usage on schema public to supabase_auth_admin;
grant select on public.profiles to supabase_auth_admin;

-- Auth hook: inject role into JWT claims
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
security definer
stable
as $$
declare
  user_role text;
begin
  select role into user_role
    from public.profiles
   where id = (event->>'user_id')::uuid;

  if user_role is not null then
    event := jsonb_set(event, '{claims,app_metadata,role}', to_jsonb(user_role));
  end if;

  return event;
end;
$$;

grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook
  from authenticated, anon, public;
