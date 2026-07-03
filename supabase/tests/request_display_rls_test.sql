begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(8);

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
    '5a000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'display-owner@example.test',
    extensions.crypt('DisplayOwner123!', extensions.gen_salt('bf')),
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
    '5a000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'display-guide@example.test',
    extensions.crypt('DisplayGuide123!', extensions.gen_salt('bf')),
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
    '5a000000-0000-4000-8000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'display-outsider@example.test',
    extensions.crypt('DisplayOutsider123!', extensions.gen_salt('bf')),
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
    '5a000000-0000-4000-8000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'display-joiner@example.test',
    extensions.crypt('DisplayJoiner123!', extensions.gen_salt('bf')),
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

insert into public.profiles (id, role, email, full_name, avatar_url)
values
  ('5a000000-0000-4000-8000-000000000001', 'traveler', 'display-owner@example.test', 'Display Owner', 'owner.jpg'),
  ('5a000000-0000-4000-8000-000000000002', 'guide', 'display-guide@example.test', 'Display Guide', 'guide.jpg'),
  ('5a000000-0000-4000-8000-000000000003', 'guide', 'display-outsider@example.test', 'Display Outsider', 'outsider.jpg'),
  ('5a000000-0000-4000-8000-000000000004', 'traveler', 'display-joiner@example.test', 'Display Joiner', 'joiner.jpg')
on conflict (id) do update set
  role = excluded.role,
  email = excluded.email,
  full_name = excluded.full_name,
  avatar_url = excluded.avatar_url,
  updated_at = timezone('utc', now());

insert into public.guide_profiles (user_id, slug, verification_status)
values
  ('5a000000-0000-4000-8000-000000000002', 'display-guide', 'approved'),
  ('5a000000-0000-4000-8000-000000000003', 'display-outsider', 'approved')
on conflict (user_id) do update set
  verification_status = excluded.verification_status,
  updated_at = timezone('utc', now());

insert into public.traveler_requests (
  id,
  traveler_id,
  destination,
  region,
  interests,
  starts_on,
  ends_on,
  budget_minor,
  currency,
  participants_count,
  format_preference,
  notes,
  open_to_join,
  allow_guide_suggestions,
  group_capacity,
  status
)
values
  (
    '5b000000-0000-4000-8000-000000000001',
    '5a000000-0000-4000-8000-000000000001',
    'Display Request',
    'Test Region',
    array['history_culture'],
    date '2026-09-01',
    date '2026-09-02',
    100000,
    'RUB',
    2,
    'group',
    'Display request one',
    true,
    true,
    4,
    'open'
  ),
  (
    '5b000000-0000-4000-8000-000000000002',
    '5a000000-0000-4000-8000-000000000001',
    'Joined Request',
    'Test Region',
    array['history_culture'],
    date '2026-09-03',
    date '2026-09-04',
    100000,
    'RUB',
    2,
    'group',
    'Display request two',
    true,
    true,
    4,
    'open'
  )
on conflict (id) do update set
  open_to_join = excluded.open_to_join,
  status = excluded.status,
  updated_at = timezone('utc', now());

insert into public.guide_offers (
  id,
  request_id,
  guide_id,
  title,
  message,
  price_minor,
  currency,
  capacity,
  starts_at,
  ends_at,
  inclusions,
  expires_at,
  status
)
values (
  '5c000000-0000-4000-8000-000000000001',
  '5b000000-0000-4000-8000-000000000001',
  '5a000000-0000-4000-8000-000000000002',
  'Display offer',
  'Relationship-scoped display test.',
  100000,
  'RUB',
  2,
  '2026-09-01 09:00+00',
  '2026-09-01 12:00+00',
  array['Guide'],
  timezone('utc', now()) + interval '7 days',
  'pending'
)
on conflict (id) do update set
  status = excluded.status,
  updated_at = timezone('utc', now());

insert into public.bookings (
  id,
  traveler_id,
  guide_id,
  request_id,
  offer_id,
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
  '5d000000-0000-4000-8000-000000000001',
  '5a000000-0000-4000-8000-000000000001',
  '5a000000-0000-4000-8000-000000000002',
  '5b000000-0000-4000-8000-000000000001',
  '5c000000-0000-4000-8000-000000000001',
  'confirmed',
  2,
  '2026-09-01 09:00+00',
  '2026-09-01 12:00+00',
  100000,
  30000,
  70000,
  'RUB',
  '{}'::jsonb,
  'Display meeting point'
)
on conflict (id) do update set
  status = excluded.status,
  updated_at = timezone('utc', now());

insert into public.open_request_members (request_id, traveler_id, status, joined_at, left_at)
values (
  '5b000000-0000-4000-8000-000000000002',
  '5a000000-0000-4000-8000-000000000004',
  'joined',
  timezone('utc', now()),
  null
)
on conflict (request_id, traveler_id) do update set
  status = excluded.status,
  joined_at = excluded.joined_at,
  left_at = excluded.left_at;

set local role anon;
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claim.sub', '', true);

select is_empty(
  $$
    select 1
      from public.traveler_requests
     where id = '5b000000-0000-4000-8000-000000000001'
  $$,
  'anon cannot select open-to-join traveler requests'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '5a000000-0000-4000-8000-000000000004', true);

select isnt_empty(
  $$
    select 1
      from public.traveler_requests
     where id = '5b000000-0000-4000-8000-000000000001'
  $$,
  'authenticated travelers can select open-to-join traveler requests'
);

select set_config('request.jwt.claim.sub', '5a000000-0000-4000-8000-000000000003', true);

select is_empty(
  $$
    select full_name, email
      from public.profiles
     where id = '5a000000-0000-4000-8000-000000000001'
  $$,
  'unrelated guides cannot select requester profiles directly'
);

select set_config('request.jwt.claim.sub', '5a000000-0000-4000-8000-000000000002', true);

select isnt_empty(
  $$
    select 1
      from public.get_interacted_requester_display_profiles()
     where request_id = '5b000000-0000-4000-8000-000000000001'
       and requester_id = '5a000000-0000-4000-8000-000000000001'
       and full_name = 'Display Owner'
       and avatar_url = 'owner.jpg'
  $$,
  'guides can read minimal requester display columns only for interacted requests'
);

select set_config('request.jwt.claim.sub', '5a000000-0000-4000-8000-000000000001', true);

select isnt_empty(
  $$
    select 1
      from public.get_traveler_booking_guide_display_profiles()
     where booking_id = '5d000000-0000-4000-8000-000000000001'
       and guide_id = '5a000000-0000-4000-8000-000000000002'
       and full_name = 'Display Guide'
       and avatar_url = 'guide.jpg'
  $$,
  'travelers can read minimal guide display columns for their bookings'
);

select set_config('request.jwt.claim.sub', '5a000000-0000-4000-8000-000000000004', true);

select isnt_empty(
  $$
    select 1
      from public.get_joined_request_owner_display_profiles()
     where request_id = '5b000000-0000-4000-8000-000000000002'
       and owner_id = '5a000000-0000-4000-8000-000000000001'
       and full_name = 'Display Owner'
       and avatar_url = 'owner.jpg'
  $$,
  'joined travelers can read minimal owner display columns for joined requests'
);

-- Booking rows are party-scoped: a user who is neither the booking's traveler nor
-- its guide cannot read the row directly, even when authenticated.
select set_config('request.jwt.claim.sub', '5a000000-0000-4000-8000-000000000003', true);

select is_empty(
  $$
    select 1
      from public.bookings
     where id = '5d000000-0000-4000-8000-000000000001'
  $$,
  'an unrelated guide cannot select another party''s booking'
);

select set_config('request.jwt.claim.sub', '5a000000-0000-4000-8000-000000000004', true);

select is_empty(
  $$
    select 1
      from public.bookings
     where id = '5d000000-0000-4000-8000-000000000001'
  $$,
  'a traveler who is not the booking owner cannot select the booking'
);

select * from finish();

rollback;
