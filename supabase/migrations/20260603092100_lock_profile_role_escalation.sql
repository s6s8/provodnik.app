drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role      public.app_role;
  v_full_name text;
begin
  v_role := case new.raw_user_meta_data->>'role'
    when 'guide' then 'guide'::public.app_role
    else 'traveler'::public.app_role
  end;
  v_full_name := coalesce(new.raw_user_meta_data->>'full_name', '');

  insert into public.profiles (id, role, email, full_name)
  values (new.id, v_role, new.email, v_full_name)
  on conflict (id) do nothing;

  if v_role = 'guide'::public.app_role then
    insert into public.guide_profiles (user_id, display_name, specialization)
    values (
      new.id,
      v_full_name,
      coalesce(new.raw_user_meta_data->>'specialization', '')
    )
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles for insert
  with check (
    (select auth.uid()::uuid) = id
    and role in ('traveler'::public.app_role, 'guide'::public.app_role)
  );

drop policy if exists "profiles_update" on public.profiles;
drop function if exists public.profile_role_for(uuid);

create function public.profile_role_for(target_user_id uuid)
returns public.app_role language sql security definer stable set search_path = public as $$
  select p.role from public.profiles p where p.id = target_user_id;
$$;

create policy "profiles_update" on public.profiles for update
  using ((select auth.uid()::uuid) = id or public.is_admin())
  with check (
    ((select auth.uid()::uuid) = id or public.is_admin())
    and role = public.profile_role_for(id)
  );
