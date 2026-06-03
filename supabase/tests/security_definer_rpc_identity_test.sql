begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(7);

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
    '41000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'rpc-owner@example.test',
    extensions.crypt('RpcOwner123!', extensions.gen_salt('bf')),
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
    '41000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'rpc-attacker@example.test',
    extensions.crypt('RpcAttacker123!', extensions.gen_salt('bf')),
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
    '41000000-0000-4000-8000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'rpc-guide@example.test',
    extensions.crypt('RpcGuide123!', extensions.gen_salt('bf')),
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
    '41000000-0000-4000-8000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'rpc-outsider@example.test',
    extensions.crypt('RpcOutsider123!', extensions.gen_salt('bf')),
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
  ('41000000-0000-4000-8000-000000000001', 'traveler', 'rpc-owner@example.test', 'RPC Owner'),
  ('41000000-0000-4000-8000-000000000002', 'traveler', 'rpc-attacker@example.test', 'RPC Attacker'),
  ('41000000-0000-4000-8000-000000000003', 'guide', 'rpc-guide@example.test', 'RPC Guide'),
  ('41000000-0000-4000-8000-000000000004', 'traveler', 'rpc-outsider@example.test', 'RPC Outsider')
on conflict (id) do update set
  role = excluded.role,
  email = excluded.email,
  full_name = excluded.full_name,
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
    '42000000-0000-4000-8000-000000000001',
    '41000000-0000-4000-8000-000000000001',
    'Identity RPC Test',
    'Test Region',
    array['Security'],
    date '2026-08-01',
    date '2026-08-02',
    100000,
    'RUB',
    2,
    'Private',
    'Unauthorized accept_offer should be denied.',
    false,
    true,
    2,
    'open'
  ),
  (
    '42000000-0000-4000-8000-000000000002',
    '41000000-0000-4000-8000-000000000001',
    'Identity RPC Test Allowed',
    'Test Region',
    array['Security'],
    date '2026-08-03',
    date '2026-08-04',
    100000,
    'RUB',
    2,
    'Private',
    'Authorized accept_offer should be allowed.',
    false,
    true,
    2,
    'open'
  )
on conflict (id) do update set
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
values
  (
    '43000000-0000-4000-8000-000000000001',
    '42000000-0000-4000-8000-000000000001',
    '41000000-0000-4000-8000-000000000003',
    'Spoofed accept offer',
    'This offer must not be accepted by an attacker.',
    100000,
    'RUB',
    2,
    '2026-08-01 09:00+00',
    '2026-08-01 12:00+00',
    array['Guide'],
    timezone('utc', now()) + interval '7 days',
    'pending'
  ),
  (
    '43000000-0000-4000-8000-000000000002',
    '42000000-0000-4000-8000-000000000002',
    '41000000-0000-4000-8000-000000000003',
    'Authorized accept offer',
    'This offer may be accepted by its traveler.',
    100000,
    'RUB',
    2,
    '2026-08-03 09:00+00',
    '2026-08-03 12:00+00',
    array['Guide'],
    timezone('utc', now()) + interval '7 days',
    'pending'
  )
on conflict (id) do update set
  status = excluded.status,
  updated_at = timezone('utc', now());

insert into public.conversation_threads (
  id,
  subject_type,
  offer_id,
  created_by
)
values (
  '44000000-0000-4000-8000-000000000001',
  'offer',
  '43000000-0000-4000-8000-000000000001',
  '41000000-0000-4000-8000-000000000001'
)
on conflict (id) do update set
  offer_id = excluded.offer_id,
  updated_at = timezone('utc', now());

set local role authenticated;

select set_config('request.jwt.claim.sub', '41000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select throws_ok(
  $$
    select public.accept_offer(
      '43000000-0000-4000-8000-000000000001'::uuid,
      '41000000-0000-4000-8000-000000000001'::uuid
    )
  $$,
  '42883',
  'function public.accept_offer(uuid, uuid) does not exist',
  'accept_offer cannot be invoked with a spoofable traveler id parameter'
);

select throws_ok(
  $$
    select public.accept_offer('43000000-0000-4000-8000-000000000001'::uuid)
  $$,
  'P0001',
  'unauthorized',
  'accept_offer denies a non-owner even without a traveler id parameter'
);

select set_config('request.jwt.claim.sub', '41000000-0000-4000-8000-000000000001', true);

select lives_ok(
  $$
    select public.accept_offer('43000000-0000-4000-8000-000000000002'::uuid)
  $$,
  'the request owner can accept their own pending offer'
);

select set_config('request.jwt.claim.sub', '41000000-0000-4000-8000-000000000001', true);

select throws_ok(
  $$
    select public.send_qa_message(
      '44000000-0000-4000-8000-000000000001'::uuid,
      '41000000-0000-4000-8000-000000000003'::uuid,
      'guide'::public.message_sender_role,
      'spoofed sender'
    )
  $$,
  'P0001',
  'unauthorized_sender',
  'send_qa_message denies a caller spoofing another sender id'
);

select set_config('request.jwt.claim.sub', '41000000-0000-4000-8000-000000000004', true);

select throws_ok(
  $$
    select public.send_qa_message(
      '44000000-0000-4000-8000-000000000001'::uuid,
      '41000000-0000-4000-8000-000000000004'::uuid,
      'traveler'::public.message_sender_role,
      'outsider sender'
    )
  $$,
  'P0001',
  'unauthorized_thread',
  'send_qa_message denies a caller outside the offer thread'
);

select set_config('request.jwt.claim.sub', '41000000-0000-4000-8000-000000000001', true);

select lives_ok(
  $$
    select public.send_qa_message(
      '44000000-0000-4000-8000-000000000001'::uuid,
      '41000000-0000-4000-8000-000000000001'::uuid,
      'traveler'::public.message_sender_role,
      'authorized sender'
    )
  $$,
  'send_qa_message allows the request owner to message their offer thread'
);

select is(
  (
    select count(*)::integer
    from public.messages
    where thread_id = '44000000-0000-4000-8000-000000000001'::uuid
      and sender_id = '41000000-0000-4000-8000-000000000001'::uuid
      and body = 'authorized sender'
  ),
  1,
  'authorized QA message is inserted exactly once'
);

select * from finish();

rollback;
