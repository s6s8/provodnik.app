do $$
declare
  seeded_at timestamptz := timezone('utc', now());
  admin_id uuid := '10000000-0000-4000-8000-000000000001';
  traveler_id uuid := '20000000-0000-4000-8000-000000000001';
  guide_id uuid := '30000000-0000-4000-8000-000000000001';
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
    is_sso_user
  )
  values
    (
      admin_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@provodnik.test',
      extensions.crypt('Admin1234!', extensions.gen_salt('bf')),
      seeded_at,
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object(
        'role', 'admin',
        'full_name', 'Алексей Смирнов',
        'avatar_url', 'https://i.pravatar.cc/150?u=admin',
        'bio', 'Администратор платформы'
      ),
      seeded_at,
      seeded_at,
      false
    ),
    (
      traveler_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'traveler@provodnik.test',
      extensions.crypt('Travel1234!', extensions.gen_salt('bf')),
      seeded_at,
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object(
        'role', 'traveler',
        'full_name', 'Мария Иванова',
        'avatar_url', 'https://i.pravatar.cc/150?u=traveler',
        'bio', 'Люблю путешествовать по России'
      ),
      seeded_at,
      seeded_at,
      false
    ),
    (
      guide_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'guide@provodnik.test',
      extensions.crypt('Guide1234!', extensions.gen_salt('bf')),
      seeded_at,
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object(
        'role', 'guide',
        'full_name', 'Дмитрий Козлов',
        'avatar_url', 'https://i.pravatar.cc/150?u=30000000-0000-4000-8000-000000000001',
        'bio', 'Специализируюсь на горах и озерах. 8 лет опыта.',
        'specialization', 'Природа и культура'
      ),
      seeded_at,
      seeded_at,
      false
    )
  on conflict do nothing;

  update auth.users
  set
    email = seed.email,
    encrypted_password = seed.encrypted_password,
    email_confirmed_at = coalesce(auth.users.email_confirmed_at, seeded_at),
    raw_app_meta_data = seed.raw_app_meta_data,
    raw_user_meta_data = seed.raw_user_meta_data,
    updated_at = seeded_at,
    is_sso_user = false
  from (
    values
      (
        admin_id,
        'admin@provodnik.test',
        extensions.crypt('Admin1234!', extensions.gen_salt('bf')),
        jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
        jsonb_build_object(
          'role', 'admin',
          'full_name', 'Алексей Смирнов',
          'avatar_url', 'https://i.pravatar.cc/150?u=admin',
          'bio', 'Администратор платформы'
        )
      ),
      (
        traveler_id,
        'traveler@provodnik.test',
        extensions.crypt('Travel1234!', extensions.gen_salt('bf')),
        jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
        jsonb_build_object(
          'role', 'traveler',
          'full_name', 'Мария Иванова',
          'avatar_url', 'https://i.pravatar.cc/150?u=traveler',
          'bio', 'Люблю путешествовать по России'
        )
      ),
      (
        guide_id,
        'guide@provodnik.test',
        extensions.crypt('Guide1234!', extensions.gen_salt('bf')),
        jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
        jsonb_build_object(
          'role', 'guide',
          'full_name', 'Дмитрий Козлов',
          'avatar_url', 'https://i.pravatar.cc/150?u=30000000-0000-4000-8000-000000000001',
          'bio', 'Специализируюсь на горах и озерах. 8 лет опыта.',
          'specialization', 'Природа и культура'
        )
      )
  ) as seed(id, email, encrypted_password, raw_app_meta_data, raw_user_meta_data)
  where auth.users.id = seed.id;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'auth'
      and table_name = 'users'
      and column_name = 'confirmed_at'
  ) then
    execute format(
      'update auth.users set confirmed_at = coalesce(confirmed_at, %L::timestamptz) where id in (%L::uuid, %L::uuid, %L::uuid)',
      seeded_at,
      admin_id,
      traveler_id,
      guide_id
    );
  end if;

  insert into public.profiles (id, role, email, full_name, avatar_url)
  values
    (
      admin_id,
      'admin',
      'admin@provodnik.test',
      'Алексей Смирнов',
      'https://i.pravatar.cc/150?u=admin'
    ),
    (
      traveler_id,
      'traveler',
      'traveler@provodnik.test',
      'Мария Иванова',
      'https://i.pravatar.cc/150?u=traveler'
    ),
    (
      guide_id,
      'guide',
      'guide@provodnik.test',
      'Дмитрий Козлов',
      'https://i.pravatar.cc/150?u=30000000-0000-4000-8000-000000000001'
    )
  on conflict do nothing;

  update public.profiles
  set
    role = seed.role,
    email = seed.email,
    full_name = seed.full_name,
    avatar_url = seed.avatar_url,
    updated_at = seeded_at
  from (
    values
      (
        admin_id,
        'admin'::public.app_role,
        'admin@provodnik.test',
        'Алексей Смирнов',
        'https://i.pravatar.cc/150?u=admin'
      ),
      (
        traveler_id,
        'traveler'::public.app_role,
        'traveler@provodnik.test',
        'Мария Иванова',
        'https://i.pravatar.cc/150?u=traveler'
      ),
      (
        guide_id,
        'guide'::public.app_role,
        'guide@provodnik.test',
        'Дмитрий Козлов',
        'https://i.pravatar.cc/150?u=30000000-0000-4000-8000-000000000001'
      )
  ) as seed(id, role, email, full_name, avatar_url)
  where public.profiles.id = seed.id;

  insert into public.guide_profiles (
    user_id,
    slug,
    display_name,
    bio,
    years_experience,
    regions,
    languages,
    specialties,
    attestation_status,
    verification_status,
    verification_notes,
    payout_account_label,
    specialization,
    rating,
    completed_tours,
    is_available
  )
  values (
    guide_id,
    'dmitriy-kozlov',
    'Дмитрий Козлов',
    'Специализируюсь на горах и озерах. 8 лет опыта.',
    8,
    array['Алтай', 'Байкал', 'Карелия'],
    array['Русский', 'English'],
    array['Природа и культура'],
    'Подтвержденный гид',
    'approved'::public.guide_verification_status,
    'Seed account for Phase 1 auth validation.',
    'Тестовый профиль',
    'Природа и культура',
    4.9,
    47,
    true
  )
  on conflict do nothing;

  update public.guide_profiles
  set
    slug = 'dmitriy-kozlov',
    display_name = 'Дмитрий Козлов',
    bio = 'Специализируюсь на горах и озерах. 8 лет опыта.',
    years_experience = 8,
    regions = array['Алтай', 'Байкал', 'Карелия'],
    languages = array['Русский', 'English'],
    specialties = array['Природа и культура'],
    attestation_status = 'Подтвержденный гид',
    verification_status = 'approved'::public.guide_verification_status,
    verification_notes = 'Seed account for Phase 1 auth validation.',
    payout_account_label = 'Тестовый профиль',
    specialization = 'Природа и культура',
    rating = 4.9,
    completed_tours = 47,
    is_available = true,
    updated_at = seeded_at
  where user_id = guide_id;
end $$;
