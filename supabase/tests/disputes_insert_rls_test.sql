begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(3);

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
    '45000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'dispute-traveler@example.test',
    extensions.crypt('DisputeTraveler123!', extensions.gen_salt('bf')),
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
  ),
  (
    '45000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'dispute-guide@example.test',
    extensions.crypt('DisputeGuide123!', extensions.gen_salt('bf')),
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
  ),
  (
    '45000000-0000-4000-8000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'dispute-outsider@example.test',
    extensions.crypt('DisputeOutsider123!', extensions.gen_salt('bf')),
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
  )
on conflict (id) do update set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = excluded.updated_at;

insert into public.profiles (id, role, email, full_name)
values
  ('45000000-0000-4000-8000-000000000001', 'traveler', 'dispute-traveler@example.test', 'Dispute Traveler'),
  ('45000000-0000-4000-8000-000000000002', 'guide', 'dispute-guide@example.test', 'Dispute Guide'),
  ('45000000-0000-4000-8000-000000000003', 'traveler', 'dispute-outsider@example.test', 'Dispute Outsider')
on conflict (id) do update set
  role = excluded.role,
  email = excluded.email,
  full_name = excluded.full_name,
  updated_at = timezone('utc', now());

insert into public.bookings (
  id,
  traveler_id,
  guide_id,
  status,
  party_size,
  starts_at,
  ends_at,
  subtotal_minor,
  deposit_minor,
  remainder_minor,
  currency,
  cancellation_policy_snapshot,
  meeting_point
)
values (
  '46000000-0000-4000-8000-000000000001',
  '45000000-0000-4000-8000-000000000001',
  '45000000-0000-4000-8000-000000000002',
  'confirmed',
  2,
  '2026-09-01 09:00+00',
  '2026-09-01 12:00+00',
  100000,
  30000,
  70000,
  'RUB',
  '{}'::jsonb,
  'Test meeting point'
)
on conflict (id) do update set
  traveler_id = excluded.traveler_id,
  guide_id = excluded.guide_id,
  status = excluded.status,
  updated_at = timezone('utc', now());

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);

select set_config('request.jwt.claim.sub', '45000000-0000-4000-8000-000000000003', true);

select throws_ok(
  $$
    insert into public.disputes (
      id,
      booking_id,
      opened_by,
      reason,
      summary,
      requested_outcome
    )
    values (
      '47000000-0000-4000-8000-000000000001',
      '46000000-0000-4000-8000-000000000001',
      '45000000-0000-4000-8000-000000000003',
      'unauthorized_booking_party',
      'Outsider must not open a dispute for another booking.',
      'deny'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "disputes"',
  'a non-party cannot insert a dispute for another booking'
);

select set_config('request.jwt.claim.sub', '45000000-0000-4000-8000-000000000001', true);

select lives_ok(
  $$
    insert into public.disputes (
      id,
      booking_id,
      opened_by,
      reason,
      summary,
      requested_outcome
    )
    values (
      '47000000-0000-4000-8000-000000000002',
      '46000000-0000-4000-8000-000000000001',
      '45000000-0000-4000-8000-000000000001',
      'authorized_booking_party',
      'Traveler can open a dispute for their own booking.',
      'review'
    )
  $$,
  'a booking party can insert a dispute they opened'
);

reset role;

select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'public'
      and tablename = 'disputes'
      and cmd = 'INSERT'
  ),
  1,
  'disputes has exactly one insert policy'
);

select * from finish();

rollback;
