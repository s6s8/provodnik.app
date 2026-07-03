begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(5);

delete from auth.users
where id in (
  '20000000-0000-4000-8000-000000000001'::uuid,
  '40000000-0000-4000-8000-000000000101'::uuid
);

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
values (
  '20000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'role-escalation-owner@example.test',
  extensions.crypt('RoleLock123!', extensions.gen_salt('bf')),
  timezone('utc', now()),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  timezone('utc', now()),
  timezone('utc', now()),
  false,
  '',
  '',
  '',
  ''
);

insert into public.profiles (id, role, email, full_name)
values (
  '20000000-0000-4000-8000-000000000001',
  'traveler',
  'role-escalation-owner@example.test',
  'Role Lock Original Name'
)
on conflict (id) do update set
  role = excluded.role,
  email = excluded.email,
  full_name = excluded.full_name,
  account_status = 'active',
  updated_at = timezone('utc', now());

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$
    update public.profiles
       set full_name = 'Role Lock Allowed Name'
     where id = '20000000-0000-4000-8000-000000000001'::uuid
  $$,
  'authenticated users can update non-role fields on their own profile'
);

select is(
  (
    select full_name
      from public.profiles
     where id = '20000000-0000-4000-8000-000000000001'::uuid
  ),
  'Role Lock Allowed Name',
  'allowed profile update persists'
);

select throws_ok(
  $$
    update public.profiles
       set role = 'admin'::public.app_role
     where id = '20000000-0000-4000-8000-000000000001'::uuid
  $$,
  '42501',
  'new row violates row-level security policy for table "profiles"',
  'authenticated users cannot elevate their profile role'
);

select is(
  (
    select role::text
      from public.profiles
     where id = '20000000-0000-4000-8000-000000000001'::uuid
  ),
  'traveler',
  'denied profile role elevation leaves the stored role unchanged'
);

reset role;

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
values (
  '40000000-0000-4000-8000-000000000101',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'role-escalation-signup@example.test',
  extensions.crypt('RoleLock123!', extensions.gen_salt('bf')),
  timezone('utc', now()),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"role":"admin","full_name":"Signup Admin Attempt"}'::jsonb,
  timezone('utc', now()),
  timezone('utc', now()),
  false,
  '',
  '',
  '',
  ''
);

select is(
  (
    select role::text
      from public.profiles
     where id = '40000000-0000-4000-8000-000000000101'::uuid
  ),
  'traveler',
  'signup metadata cannot grant admin role'
);

select * from finish();

rollback;
