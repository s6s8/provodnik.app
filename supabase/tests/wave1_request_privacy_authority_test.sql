-- Wave 1 (#64, #80-84, #88, #89, #92) — request privacy and public-data authority.
begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(17);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  is_sso_user, confirmation_token, email_change, email_change_token_new, recovery_token
)
values
  ('7a000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'w1-owner@example.test',
   extensions.crypt('W1Owner123!', extensions.gen_salt('bf')), timezone('utc', now()),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
   timezone('utc', now()), timezone('utc', now()), false, '', '', '', ''),
  ('7a000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'w1-addressed@example.test',
   extensions.crypt('W1Addressed123!', extensions.gen_salt('bf')), timezone('utc', now()),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
   timezone('utc', now()), timezone('utc', now()), false, '', '', '', ''),
  ('7a000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'w1-outsider-guide@example.test',
   extensions.crypt('W1OutsiderGuide123!', extensions.gen_salt('bf')), timezone('utc', now()),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
   timezone('utc', now()), timezone('utc', now()), false, '', '', '', ''),
  ('7a000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'w1-outsider-traveler@example.test',
   extensions.crypt('W1OutsiderTraveler123!', extensions.gen_salt('bf')), timezone('utc', now()),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
   timezone('utc', now()), timezone('utc', now()), false, '', '', '', '')
on conflict (id) do update set email = excluded.email, updated_at = excluded.updated_at;

insert into public.profiles (id, role, email, full_name, account_status)
values
  ('7a000000-0000-4000-8000-000000000001', 'traveler', 'w1-owner@example.test', 'W1 Owner', 'active'),
  ('7a000000-0000-4000-8000-000000000002', 'guide', 'w1-addressed@example.test', 'W1 Addressed Guide', 'active'),
  ('7a000000-0000-4000-8000-000000000003', 'guide', 'w1-outsider-guide@example.test', 'W1 Outsider Guide', 'active'),
  ('7a000000-0000-4000-8000-000000000004', 'traveler', 'w1-outsider-traveler@example.test', 'W1 Outsider Traveler', 'active')
on conflict (id) do update set role = excluded.role, account_status = excluded.account_status;

insert into public.guide_profiles (user_id, slug, verification_status, is_available)
values
  ('7a000000-0000-4000-8000-000000000002', 'w1-addressed-guide', 'approved', true),
  ('7a000000-0000-4000-8000-000000000003', 'w1-outsider-guide', 'approved', true)
on conflict (user_id) do update set verification_status = 'approved', is_available = true;

insert into public.traveler_requests (
  id, traveler_id, destination, region, interests, starts_on, ends_on, budget_minor,
  currency, participants_count, format_preference, notes, open_to_join, status, target_guide_id,
  date_flexibility
)
values
  ('7b000000-0000-4000-8000-000000000001', '7a000000-0000-4000-8000-000000000001',
   'Directed Private', 'Test', array['culture'], current_date + 20, current_date + 21,
   100000, 'RUB', 2, 'Private', 'Directed notes', false, 'open',
   '7a000000-0000-4000-8000-000000000002', 'few_days'),
  ('7b000000-0000-4000-8000-000000000002', '7a000000-0000-4000-8000-000000000001',
   'Public Assembly', 'Test', array['culture'], current_date + 20, current_date + 21,
   100000, 'RUB', 2, 'group', 'Public notes', true, 'open', null, 'few_days'),
  ('7b000000-0000-4000-8000-000000000003', '7a000000-0000-4000-8000-000000000001',
   'Booked Request', 'Test', array['culture'], current_date + 20, current_date + 21,
   100000, 'RUB', 2, 'Private', 'Booked notes', false, 'booked', null, 'few_days'),
  ('7b000000-0000-4000-8000-000000000004', '7a000000-0000-4000-8000-000000000001',
   'Expired Request', 'Test', array['culture'], current_date - 2, current_date - 1,
   100000, 'RUB', 2, 'Private', 'Expired notes', false, 'open', null, 'few_days')
on conflict (id) do update set status = excluded.status, target_guide_id = excluded.target_guide_id;

insert into public.guide_offers (
  id, request_id, guide_id, price_minor, currency, status, starts_at, ends_at, expires_at
)
values
  ('7c000000-0000-4000-8000-000000000001', '7b000000-0000-4000-8000-000000000002',
   '7a000000-0000-4000-8000-000000000003', 100000, 'RUB', 'pending',
   ((current_date + 20)::date + time '10:00') at time zone 'Europe/Moscow',
   ((current_date + 20)::date + time '14:00') at time zone 'Europe/Moscow',
   timezone('utc', now()) + interval '7 days')
on conflict (id) do update set status = excluded.status;

-- Public discovery: directed request stays hidden from anonymous visitors.
set local role anon;
select is_empty(
  $$ select 1 from public.v_public_open_requests where id = '7b000000-0000-4000-8000-000000000001' $$,
  'anonymous visitor cannot discover a directed request in the public view'
);

-- Unrelated authenticated guide cannot read directed request details.
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '7a000000-0000-4000-8000-000000000003', true);
select is_empty(
  $$ select 1 from public.traveler_requests where id = '7b000000-0000-4000-8000-000000000001' $$,
  'unrelated guide cannot read a directed request via direct table access'
);

-- Owner retains access to their directed request.
select set_config('request.jwt.claim.sub', '7a000000-0000-4000-8000-000000000001', true);
select isnt_empty(
  $$ select 1 from public.traveler_requests where id = '7b000000-0000-4000-8000-000000000001' $$,
  'owner can read their directed request'
);

-- Addressed guide retains access without bidding first.
select set_config('request.jwt.claim.sub', '7a000000-0000-4000-8000-000000000002', true);
select isnt_empty(
  $$ select 1 from public.traveler_requests where id = '7b000000-0000-4000-8000-000000000001' $$,
  'addressed guide can read the directed request addressed to them'
);

-- Social proof RPC is empty for directed requests.
select is(
  (select count(*)::integer from public.get_bidding_guides_for_request('7b000000-0000-4000-8000-000000000001')),
  0,
  'get_bidding_guides_for_request returns no rows for a directed request'
);

-- Social proof RPC returns the bidding guide on a discoverable assembly request.
select is(
  (select count(*)::integer from public.get_bidding_guides_for_request('7b000000-0000-4000-8000-000000000002')),
  1,
  'get_bidding_guides_for_request returns social proof for a discoverable assembly request'
);

-- Outsider guide cannot offer on a directed request addressed to someone else.
select set_config('request.jwt.claim.sub', '7a000000-0000-4000-8000-000000000003', true);
select throws_ok(
  $$ insert into public.guide_offers (request_id, guide_id, price_minor, currency, status, starts_at, ends_at, expires_at)
     values ('7b000000-0000-4000-8000-000000000001', '7a000000-0000-4000-8000-000000000003',
             100000, 'RUB', 'pending',
             ((current_date + 20)::date + time '10:00') at time zone 'Europe/Moscow',
             ((current_date + 20)::date + time '14:00') at time zone 'Europe/Moscow',
             timezone('utc', now()) + interval '7 days') $$,
  'new row violates row-level security policy for table "guide_offers"',
  'unrelated guide cannot insert an offer on a directed request'
);

-- Addressed guide may offer on their directed request.
select set_config('request.jwt.claim.sub', '7a000000-0000-4000-8000-000000000002', true);
select lives_ok(
  $$ insert into public.guide_offers (id, request_id, guide_id, price_minor, currency, status, starts_at, ends_at, expires_at)
     values ('7c000000-0000-4000-8000-000000000002', '7b000000-0000-4000-8000-000000000001',
             '7a000000-0000-4000-8000-000000000002', 100000, 'RUB', 'pending',
             ((current_date + 20)::date + time '10:00') at time zone 'Europe/Moscow',
             ((current_date + 20)::date + time '14:00') at time zone 'Europe/Moscow',
             timezone('utc', now()) + interval '7 days') $$,
  'addressed guide can insert an offer on their directed request'
);

-- Travelers cannot join a directed request.
select set_config('request.jwt.claim.sub', '7a000000-0000-4000-8000-000000000004', true);
select throws_ok(
  $$ insert into public.open_request_members (request_id, traveler_id, status, joined_at)
     values ('7b000000-0000-4000-8000-000000000001', '7a000000-0000-4000-8000-000000000004', 'joined', now()) $$,
  'new row violates row-level security policy for table "open_request_members"',
  'unrelated traveler cannot join a directed request'
);

-- Thread helpers ignore a spoofed target user id and bind to auth.uid().
select set_config('request.jwt.claim.sub', '7a000000-0000-4000-8000-000000000003', true);
select is(
  public.can_access_request_thread(
    '7b000000-0000-4000-8000-000000000001',
    '7a000000-0000-4000-8000-000000000001'
  ),
  false,
  'can_access_request_thread cannot be probed with a spoofed owner user id'
);

select set_config('request.jwt.claim.sub', '7a000000-0000-4000-8000-000000000002', true);
select is(
  public.can_access_request_thread('7b000000-0000-4000-8000-000000000001'),
  true,
  'addressed guide can access the directed request thread without an offer or view row'
);

-- Marketplace events: owner may record through the scoped RPC.
select set_config('request.jwt.claim.sub', '7a000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$ select public.record_marketplace_event(
       'request'::public.event_scope,
       '7b000000-0000-4000-8000-000000000002'::uuid,
       null::uuid, null::uuid,
       'request_note', 'Owner event', null::text, '{}'::jsonb) $$,
  'request owner can record a marketplace event for their request'
);

-- Marketplace events: unrelated actor is denied.
select set_config('request.jwt.claim.sub', '7a000000-0000-4000-8000-000000000004', true);
select throws_ok(
  $$ select public.record_marketplace_event(
       'request'::public.event_scope,
       '7b000000-0000-4000-8000-000000000002'::uuid,
       null::uuid, null::uuid,
       'spoofed_event', 'Outsider event', null::text, '{}'::jsonb) $$,
  'P0001',
  'unauthorized_event_actor',
  'unrelated traveler cannot record marketplace events for someone else request'
);

-- Closed (booked) requests reject new offers.
select set_config('request.jwt.claim.sub', '7a000000-0000-4000-8000-000000000003', true);
select throws_ok(
  $$ insert into public.guide_offers (request_id, guide_id, price_minor, currency, status, starts_at, ends_at, expires_at)
     values ('7b000000-0000-4000-8000-000000000003', '7a000000-0000-4000-8000-000000000003',
             100000, 'RUB', 'pending',
             ((current_date + 20)::date + time '10:00') at time zone 'Europe/Moscow',
             ((current_date + 20)::date + time '14:00') at time zone 'Europe/Moscow',
             timezone('utc', now()) + interval '7 days') $$,
  'new row violates row-level security policy for table "guide_offers"',
  'guide cannot insert an offer on a booked request'
);

-- Request expiry mechanism marks stale open requests expired.
set local role postgres;
select public.expire_open_traveler_requests();
select is(
  (select status::text from public.traveler_requests where id = '7b000000-0000-4000-8000-000000000004'),
  'expired',
  'expire_open_traveler_requests marks past starts_on requests as expired'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '7a000000-0000-4000-8000-000000000003', true);
select throws_ok(
  $$ insert into public.guide_offers (request_id, guide_id, price_minor, currency, status, starts_at, ends_at, expires_at)
     values ('7b000000-0000-4000-8000-000000000004', '7a000000-0000-4000-8000-000000000003',
             100000, 'RUB', 'pending',
             ((current_date - 2)::date + time '10:00') at time zone 'Europe/Moscow',
             ((current_date - 2)::date + time '14:00') at time zone 'Europe/Moscow',
             timezone('utc', now()) + interval '7 days') $$,
  '42501',
  'new row violates row-level security policy for table "guide_offers"',
  'guide cannot insert an offer on an expired request'
);

set local role postgres;
insert into public.guide_offers (
  id, request_id, guide_id, price_minor, currency, status, starts_at, ends_at, expires_at
)
values (
  '7c000000-0000-4000-8000-000000000003', '7b000000-0000-4000-8000-000000000003',
  '7a000000-0000-4000-8000-000000000003', 100000, 'RUB', 'pending',
  ((current_date + 20)::date + time '10:00') at time zone 'Europe/Moscow',
  ((current_date + 20)::date + time '14:00') at time zone 'Europe/Moscow',
  timezone('utc', now()) + interval '7 days'
)
on conflict (id) do update set status = 'pending';

set local role authenticated;
select set_config('request.jwt.claim.sub', '7a000000-0000-4000-8000-000000000001', true);
select throws_ok(
  $$ select public.accept_offer('7c000000-0000-4000-8000-000000000003'::uuid) $$,
  'P0001',
  'request_not_open',
  'accept_offer rejects offers on a non-open request'
);

select * from finish();
rollback;
