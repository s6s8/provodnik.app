-- Repair documented test/demo credentials on the auth.users row that already owns each email.
-- Hosted DBs often have non-seed UUIDs (e.g. admin@provodnik.app created via dashboard/API);
-- migrations that upsert by fixed id (20260602000003) never update those rows, so documented
-- passwords keep failing with "Invalid login credentials" while API-created debug users work.

do $$
declare
  seeded_at timestamptz := timezone('utc', now());
  acct_email text;
  acct_plain_password text;
  acct_profile_role public.app_role;
  acct_full_name text;
  target_user_id uuid;
begin
  for acct_email, acct_plain_password, acct_profile_role, acct_full_name in
    select *
    from (
      values
        (
          'admin@provodnik.test',
          'Admin1234!',
          'admin'::public.app_role,
          'Алексей Смирнов'
        ),
        (
          'traveler@provodnik.test',
          'Travel1234!',
          'traveler'::public.app_role,
          'Мария Иванова'
        ),
        (
          'guide@provodnik.test',
          'Guide1234!',
          'guide'::public.app_role,
          'Дмитрий Козлов'
        ),
        (
          'admin@provodnik.app',
          'Demo1234!',
          'admin'::public.app_role,
          'Администратор'
        ),
        (
          'traveler@provodnik.app',
          'Demo1234!',
          'traveler'::public.app_role,
          'Демо Путешественник'
        ),
        (
          'guide@provodnik.app',
          'Demo1234!',
          'guide'::public.app_role,
          'Алексей Соколов'
        )
    ) as seed(email, plain_password, profile_role, full_name)
  loop
    update auth.users as u
    set
      encrypted_password = extensions.crypt(acct_plain_password, extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(u.email_confirmed_at, seeded_at),
      raw_app_meta_data = coalesce(u.raw_app_meta_data, '{}'::jsonb)
        || jsonb_build_object(
          'provider',
          'email',
          'providers',
          jsonb_build_array('email'),
          'role',
          acct_profile_role::text
        ),
      raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb)
        || jsonb_build_object('role', acct_profile_role::text),
      confirmation_token = coalesce(u.confirmation_token, ''),
      recovery_token = coalesce(u.recovery_token, ''),
      email_change_token_new = coalesce(u.email_change_token_new, ''),
      email_change = coalesce(u.email_change, ''),
      is_sso_user = false,
      updated_at = seeded_at
    where lower(trim(u.email)) = lower(acct_email)
    returning u.id into target_user_id;

    if target_user_id is null then
      continue;
    end if;

    insert into public.profiles (id, role, email, full_name)
    values (target_user_id, acct_profile_role, acct_email, acct_full_name)
    on conflict (id) do update set
      role = acct_profile_role,
      email = excluded.email,
      full_name = coalesce(nullif(trim(excluded.full_name), ''), profiles.full_name),
      updated_at = seeded_at;

    delete from auth.identities as i
    where i.user_id = target_user_id
      and i.provider = 'email'
      and i.provider_id is distinct from target_user_id::text;

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
    values (
      extensions.gen_random_uuid(),
      target_user_id::text,
      target_user_id,
      jsonb_build_object(
        'sub',
        target_user_id::text,
        'email',
        acct_email,
        'email_verified',
        true,
        'phone_verified',
        false
      ),
      'email',
      seeded_at,
      seeded_at,
      seeded_at
    )
    on conflict (provider, provider_id) do update set
      user_id = excluded.user_id,
      identity_data = excluded.identity_data,
      updated_at = seeded_at;
  end loop;
end $$;
