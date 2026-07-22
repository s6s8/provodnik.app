begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(7);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  is_sso_user, confirmation_token, email_change, email_change_token_new, recovery_token)
values
  ('74000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'offer-expiry-traveler@example.test',
   extensions.crypt('x', extensions.gen_salt('bf')), now(), '{"provider":"email"}', '{}',
   now(), now(), false, '', '', '', ''),
  ('74000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'offer-expiry-guide@example.test',
   extensions.crypt('x', extensions.gen_salt('bf')), now(), '{"provider":"email"}', '{}',
   now(), now(), false, '', '', '', '');

insert into public.profiles (id, role, email, full_name, account_status)
values
  ('74000000-0000-4000-8000-000000000001', 'traveler', 'offer-expiry-traveler@example.test', 'Traveler', 'active'),
  ('74000000-0000-4000-8000-000000000002', 'guide', 'offer-expiry-guide@example.test', 'Guide', 'active')
on conflict (id) do update set role = excluded.role, account_status = excluded.account_status;

insert into public.guide_profiles (user_id, slug, verification_status, is_available)
values ('74000000-0000-4000-8000-000000000002', 'offer-expiry-guide', 'approved', true);

-- One request per scenario: guide_offers_one_active_per_guide_request allows only one
-- live offer per (request, guide), and every offer below belongs to the same guide.
insert into public.traveler_requests (
  id, traveler_id, destination, interests, starts_on, ends_on, budget_minor,
  participants_count, status, date_flexibility
)
values
  ('75000000-0000-4000-8000-000000000001', '74000000-0000-4000-8000-000000000001',
   'Direct writes', array['culture'], current_date + 30, current_date + 31, 100000, 1, 'open', 'few_days'),
  ('75000000-0000-4000-8000-000000000002', '74000000-0000-4000-8000-000000000001',
   'Legacy row', array['culture'], current_date + 30, current_date + 31, 100000, 1, 'open', 'few_days'),
  ('75000000-0000-4000-8000-000000000003', '74000000-0000-4000-8000-000000000001',
   'Counter', array['culture'], current_date + 30, current_date + 31, 100000, 1, 'open', 'few_days');

-- Rows that predate the guard. replica mode skips user triggers, which is the only way
-- to reproduce the expired-but-pending data already in production.
set local session_replication_role = replica;
insert into public.guide_offers (id, request_id, guide_id, price_minor, status, expires_at)
values
  ('76000000-0000-4000-8000-000000000009', '75000000-0000-4000-8000-000000000002',
   '74000000-0000-4000-8000-000000000002', 100000, 'pending', now() - interval '2 days'),
  ('76000000-0000-4000-8000-000000000003', '75000000-0000-4000-8000-000000000003',
   '74000000-0000-4000-8000-000000000002', 100000, 'pending', now() - interval '1 day');
set local session_replication_role = origin;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '74000000-0000-4000-8000-000000000002', true);

select throws_ok(
  $$
    insert into public.guide_offers (id, request_id, guide_id, price_minor, status, expires_at)
    values ('76000000-0000-4000-8000-000000000001',
      '75000000-0000-4000-8000-000000000001',
      '74000000-0000-4000-8000-000000000002', 100000, 'pending', now() - interval '1 minute')
  $$,
  '23514',
  'offer_expiry_must_be_in_future',
  'direct guide insert cannot create an already expired pending offer'
);

select lives_ok(
  $$
    insert into public.guide_offers (id, request_id, guide_id, price_minor, status, expires_at)
    values ('76000000-0000-4000-8000-000000000002',
      '75000000-0000-4000-8000-000000000001',
      '74000000-0000-4000-8000-000000000002', 100000, 'pending', now() + interval '3 days')
  $$,
  'direct guide insert accepts a future expiry'
);

select throws_ok(
  $$
    update public.guide_offers
       set expires_at = now() - interval '1 minute'
     where id = '76000000-0000-4000-8000-000000000002'
  $$,
  '23514',
  'offer_expiry_must_be_in_future',
  'direct guide update cannot back-date a pending offer expiry'
);

-- Legacy expired-pending rows stay writable, so they can still be cleaned up.
select lives_ok(
  $$
    update public.guide_offers
       set status = 'declined'
     where id = '76000000-0000-4000-8000-000000000009'
  $$,
  'a legacy expired pending offer can still be declined'
);

select throws_ok(
  $$
    update public.guide_offers
       set status = 'pending'
     where id = '76000000-0000-4000-8000-000000000009'
  $$,
  '23514',
  'offer_expiry_must_be_in_future',
  'an expired offer cannot be flipped back to pending on a dead expiry'
);

select set_config('request.jwt.claim.sub', '74000000-0000-4000-8000-000000000001', true);

select throws_ok(
  $$ select public.counter_offer('76000000-0000-4000-8000-000000000003'::uuid, 90000, 'ниже') $$,
  'P0001',
  'offer_expired',
  'counter_offer rejects an expired offer instead of cloning its dead timestamp'
);

set local role postgres;

select is(
  (
    select count(*)::int
    from public.guide_offers
    where request_id = '75000000-0000-4000-8000-000000000003'
  ),
  1,
  'no replacement offer was created for the expired source offer'
);

select * from finish();
rollback;
