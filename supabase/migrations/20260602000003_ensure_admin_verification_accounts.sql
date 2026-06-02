-- Ensure admin verification personas exist for admin checklist walks.
-- Keeps authorization role-gated: access still depends on public.profiles.role = 'admin'.

do $$
declare
  seeded_at timestamptz := timezone('utc', now());
begin
  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    is_sso_user,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  values
    (
      '10000000-0000-4000-8000-000000000001',
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@provodnik.test',
      extensions.crypt('Admin1234!', extensions.gen_salt('bf')),
      seeded_at,
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'), 'role', 'admin'),
      jsonb_build_object('role', 'admin', 'full_name', 'Алексей Смирнов', 'avatar_url', 'https://i.pravatar.cc/150?u=admin'),
      seeded_at,
      seeded_at,
      false,
      '',
      '',
      '',
      ''
    ),
    (
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@provodnik.app',
      extensions.crypt('Demo1234!', extensions.gen_salt('bf')),
      seeded_at,
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'), 'role', 'admin'),
      jsonb_build_object('role', 'admin', 'full_name', 'Администратор'),
      seeded_at,
      seeded_at,
      false,
      '',
      '',
      '',
      ''
    )
  on conflict (id) do update set
    email = excluded.email,
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = coalesce(auth.users.email_confirmed_at, excluded.email_confirmed_at),
    raw_app_meta_data = excluded.raw_app_meta_data,
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = seeded_at,
    is_sso_user = false,
    confirmation_token = excluded.confirmation_token,
    email_change = excluded.email_change,
    email_change_token_new = excluded.email_change_token_new,
    recovery_token = excluded.recovery_token;

  insert into auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values
    (
      extensions.gen_random_uuid(),
      '10000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      '{"sub":"10000000-0000-4000-8000-000000000001","email":"admin@provodnik.test","email_verified":true,"phone_verified":false}'::jsonb,
      'email',
      seeded_at,
      seeded_at,
      seeded_at
    ),
    (
      extensions.gen_random_uuid(),
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000001',
      '{"sub":"00000000-0000-4000-8000-000000000001","email":"admin@provodnik.app","email_verified":true,"phone_verified":false}'::jsonb,
      'email',
      seeded_at,
      seeded_at,
      seeded_at
    )
  on conflict (provider, provider_id) do update set
    user_id = excluded.user_id,
    identity_data = excluded.identity_data,
    updated_at = seeded_at;

  insert into public.profiles (id, role, email, full_name, avatar_url)
  values
    (
      '10000000-0000-4000-8000-000000000001',
      'admin',
      'admin@provodnik.test',
      'Алексей Смирнов',
      'https://i.pravatar.cc/150?u=admin'
    ),
    (
      '00000000-0000-4000-8000-000000000001',
      'admin',
      'admin@provodnik.app',
      'Администратор',
      null
    )
  on conflict (id) do update set
    role = 'admin'::public.app_role,
    email = excluded.email,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    updated_at = seeded_at;
end $$;
