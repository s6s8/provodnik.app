begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(9);

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
    '48000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'thread-traveler@example.test',
    extensions.crypt('ThreadTraveler123!', extensions.gen_salt('bf')),
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
    '48000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'thread-guide-offer@example.test',
    extensions.crypt('ThreadGuideOffer123!', extensions.gen_salt('bf')),
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
    '48000000-0000-4000-8000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'thread-guide-outsider@example.test',
    extensions.crypt('ThreadGuideOutsider123!', extensions.gen_salt('bf')),
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
    '48000000-0000-4000-8000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'thread-guide-eligible@example.test',
    extensions.crypt('ThreadGuideEligible123!', extensions.gen_salt('bf')),
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
  ('48000000-0000-4000-8000-000000000001', 'traveler', 'thread-traveler@example.test', 'Thread Traveler'),
  ('48000000-0000-4000-8000-000000000002', 'guide', 'thread-guide-offer@example.test', 'Thread Guide Offer'),
  ('48000000-0000-4000-8000-000000000003', 'guide', 'thread-guide-outsider@example.test', 'Thread Guide Outsider'),
  ('48000000-0000-4000-8000-000000000004', 'guide', 'thread-guide-eligible@example.test', 'Thread Guide Eligible')
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
values (
  '49000000-0000-4000-8000-000000000001',
  '48000000-0000-4000-8000-000000000001',
  'Thread Access Test',
  'Test Region',
  array['Culture'],
  date '2026-08-10',
  date '2026-08-11',
  100000,
  'RUB',
  2,
  'Private',
  'Request thread access must follow relationship, not guide role alone.',
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
values (
  '49000000-0000-4000-8000-000000000002',
  '49000000-0000-4000-8000-000000000001',
  '48000000-0000-4000-8000-000000000002',
  'Thread access offer',
  'Guide with an offer on the request may read its thread.',
  100000,
  'RUB',
  2,
  '2026-08-10 09:00+00',
  '2026-08-10 12:00+00',
  array['Guide'],
  timezone('utc', now()) + interval '7 days',
  'pending'
)
on conflict (id) do update set
  status = excluded.status,
  updated_at = timezone('utc', now());

insert into public.request_views (request_id, guide_id, viewed_at)
values (
  '49000000-0000-4000-8000-000000000001',
  '48000000-0000-4000-8000-000000000004',
  timezone('utc', now())
)
on conflict (request_id, guide_id) do update set
  viewed_at = excluded.viewed_at;

insert into public.conversation_threads (
  id,
  subject_type,
  request_id,
  created_by
)
values (
  '49000000-0000-4000-8000-000000000003',
  'request',
  '49000000-0000-4000-8000-000000000001',
  '48000000-0000-4000-8000-000000000001'
)
on conflict (id) do update set
  request_id = excluded.request_id,
  updated_at = timezone('utc', now());

insert into public.conversation_threads (
  id,
  subject_type,
  offer_id,
  created_by
)
values (
  '49000000-0000-4000-8000-000000000004',
  'offer',
  '49000000-0000-4000-8000-000000000002',
  '48000000-0000-4000-8000-000000000001'
)
on conflict (id) do update set
  offer_id = excluded.offer_id,
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
  '49000000-0000-4000-8000-000000000005',
  '48000000-0000-4000-8000-000000000001',
  '48000000-0000-4000-8000-000000000002',
  '49000000-0000-4000-8000-000000000001',
  '49000000-0000-4000-8000-000000000002',
  'confirmed',
  2,
  '2026-08-10 09:00+00',
  '2026-08-10 12:00+00',
  100000,
  30000,
  70000,
  'RUB',
  '{}'::jsonb,
  'Thread access booking meeting point'
)
on conflict (id) do update set
  status = excluded.status,
  updated_at = timezone('utc', now());

insert into public.conversation_threads (
  id,
  subject_type,
  booking_id,
  created_by
)
values (
  '49000000-0000-4000-8000-000000000006',
  'booking',
  '49000000-0000-4000-8000-000000000005',
  '48000000-0000-4000-8000-000000000001'
)
on conflict (id) do update set
  booking_id = excluded.booking_id,
  updated_at = timezone('utc', now());

insert into public.messages (
  id,
  thread_id,
  sender_id,
  sender_role,
  body
)
values (
  '4a000000-0000-4000-8000-000000000001',
  '49000000-0000-4000-8000-000000000004',
  '48000000-0000-4000-8000-000000000001',
  'traveler',
  'Offer QA thread message'
)
on conflict (id) do update set
  body = excluded.body;

select is(
  public.can_access_request_thread(
    '49000000-0000-4000-8000-000000000001',
    '48000000-0000-4000-8000-000000000003'
  ),
  false,
  'can_access_request_thread denies an unrelated guide'
);

select is(
  public.can_access_request_thread(
    '49000000-0000-4000-8000-000000000001',
    '48000000-0000-4000-8000-000000000002'
  ),
  true,
  'can_access_request_thread allows a guide with an offer on the request'
);

select is(
  public.can_access_request_thread(
    '49000000-0000-4000-8000-000000000001',
    '48000000-0000-4000-8000-000000000004'
  ),
  true,
  'can_access_request_thread allows a guide eligible via request_views'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '48000000-0000-4000-8000-000000000003', true);

select is_empty(
  $$
    select 1
      from public.conversation_threads
     where id = '49000000-0000-4000-8000-000000000003'
  $$,
  'unrelated guide cannot select a request thread under RLS'
);

select set_config('request.jwt.claim.sub', '48000000-0000-4000-8000-000000000002', true);

select isnt_empty(
  $$
    select 1
      from public.conversation_threads
     where id = '49000000-0000-4000-8000-000000000003'
  $$,
  'guide with an offer can select the request thread under RLS'
);

select set_config('request.jwt.claim.sub', '48000000-0000-4000-8000-000000000001', true);

select isnt_empty(
  $$
    select 1
      from public.conversation_threads
     where id = '49000000-0000-4000-8000-000000000004'
  $$,
  'traveler can select an offer QA thread without thread_participants rows'
);

select isnt_empty(
  $$
    select 1
      from public.messages
     where thread_id = '49000000-0000-4000-8000-000000000004'
  $$,
  'traveler can select messages on an offer QA thread via the canonical helper'
);

select set_config('request.jwt.claim.sub', '48000000-0000-4000-8000-000000000002', true);

select isnt_empty(
  $$
    select 1
      from public.conversation_threads
     where id = '49000000-0000-4000-8000-000000000006'
  $$,
  'booking guide can select a booking thread without compensating stacked policies'
);

reset role;

select is(
  (
    select count(*)::integer
      from pg_policies
     where schemaname = 'public'
       and tablename in ('conversation_threads', 'messages')
       and policyname in (
         'traveler_select_booking_thread',
         'traveler_select_booking_messages',
         'guide_select_booking_thread',
         'guide_select_booking_messages',
         'select_offer_thread_via_helper',
         'select_offer_thread_messages_via_helper'
       )
  ),
  0,
  'compensating stacked thread SELECT policies are removed'
);

select * from finish();

rollback;
