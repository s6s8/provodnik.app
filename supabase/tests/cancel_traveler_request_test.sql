-- Owner 609 P1: cancelling a booked request cancels its booking atomically.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(6);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  is_sso_user, confirmation_token, email_change, email_change_token_new, recovery_token)
values
  ('64000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','cx-trav@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),'{"provider":"email"}','{}', now(), now(), false,'','','',''),
  ('64000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','cx-guide@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),'{"provider":"email"}','{}', now(), now(), false,'','','',''),
  ('64000000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','cx-other@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),'{"provider":"email"}','{}', now(), now(), false,'','','','');

insert into public.profiles (id, role, email, full_name, account_status)
values
  ('64000000-0000-4000-8000-000000000001','traveler','cx-trav@example.test','T','active'),
  ('64000000-0000-4000-8000-000000000002','guide','cx-guide@example.test','G','active'),
  ('64000000-0000-4000-8000-000000000003','traveler','cx-other@example.test','O','active')
on conflict (id) do update set role=excluded.role, account_status=excluded.account_status;

insert into public.traveler_requests (id, traveler_id, destination, region, status,
        participants_count, starts_on, ends_on)
values ('64000000-0000-4000-8000-0000000000a1','64000000-0000-4000-8000-000000000001',
        'Элиста','Калмыкия','booked',2,(now()+interval '10 days')::date,(now()+interval '12 days')::date);

insert into public.bookings (id, traveler_id, guide_id, request_id, status, party_size,
        subtotal_minor, currency, cancellation_policy_snapshot)
values ('64000000-0000-4000-8000-0000000000b1','64000000-0000-4000-8000-000000000001',
        '64000000-0000-4000-8000-000000000002','64000000-0000-4000-8000-0000000000a1',
        'confirmed',2,500000,'RUB','{}'::jsonb);

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated', true);

-- A non-owner cannot cancel.
select set_config('request.jwt.claim.sub','64000000-0000-4000-8000-000000000003', true);
select throws_ok(
  $$select public.cancel_traveler_request('64000000-0000-4000-8000-0000000000a1')$$,
  'unauthorized', 'non-owner cannot cancel the request');

-- The owner cancels.
select set_config('request.jwt.claim.sub','64000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$select public.cancel_traveler_request('64000000-0000-4000-8000-0000000000a1')$$,
  'owner cancels the booked request');

-- Request is cancelled.
select is(
  (select status::text from public.traveler_requests where id='64000000-0000-4000-8000-0000000000a1'),
  'cancelled', 'request is cancelled');

-- The linked booking is cancelled in the same transaction — no live booking left.
select is(
  (select status::text from public.bookings where id='64000000-0000-4000-8000-0000000000b1'),
  'cancelled', 'linked booking is cancelled atomically');

-- Cancelling an already-cancelled request is rejected.
select throws_ok(
  $$select public.cancel_traveler_request('64000000-0000-4000-8000-0000000000a1')$$,
  'not_cancellable', 'a cancelled request cannot be cancelled again');

-- Unknown request id is rejected.
select throws_ok(
  $$select public.cancel_traveler_request('64000000-0000-4000-8000-0000000000ff')$$,
  'request_not_found', 'unknown request id is rejected');

select finish();
rollback;
