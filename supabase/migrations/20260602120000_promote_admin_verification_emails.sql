-- Promote checklist admin personas by email (hosted DB may have auth.users.id
-- that differs from seed UUIDs). Authorization stays profiles.role = 'admin'.

do $$
declare
  seeded_at timestamptz := timezone('utc', now());
  target_email text;
begin
  foreach target_email in array array['admin@provodnik.app', 'admin@provodnik.test'] loop
    insert into public.profiles (id, role, email, full_name)
    select
      u.id,
      'admin'::public.app_role,
      u.email,
      coalesce(nullif(trim(u.raw_user_meta_data->>'full_name'), ''), 'Администратор')
    from auth.users u
    where lower(trim(u.email)) = lower(target_email)
    on conflict (id) do update set
      role = 'admin'::public.app_role,
      email = excluded.email,
      full_name = coalesce(nullif(trim(excluded.full_name), ''), profiles.full_name),
      updated_at = seeded_at;

    update auth.users u
    set
      raw_app_meta_data = coalesce(u.raw_app_meta_data, '{}'::jsonb)
        || jsonb_build_object(
          'provider',
          'email',
          'providers',
          jsonb_build_array('email'),
          'role',
          'admin'
        ),
      raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb)
        || jsonb_build_object('role', 'admin'),
      updated_at = seeded_at
    where lower(trim(u.email)) = lower(target_email);
  end loop;
end $$;
