-- Wave 1 #55/#56: booking commercial + state integrity at the DB boundary.
begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(9);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  is_sso_user, confirmation_token, email_change, email_change_token_new, recovery_token)
values
  ('71000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','w1-trav@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),'{"provider":"email"}','{}', now(), now(), false,'','','',''),
  ('71000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','w1-guide@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),'{"provider":"email"}','{}', now(), now(), false,'','','',''),
  ('71000000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','w1-outsider@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),'{"provider":"email"}','{}', now(), now(), false,'','','','');

insert into public.profiles (id, role, email, full_name, account_status)
values
  ('71000000-0000-4000-8000-000000000001','traveler','w1-trav@example.test','T','active'),
  ('71000000-0000-4000-8000-000000000002','guide','w1-guide@example.test','G','active'),
  ('71000000-0000-4000-8000-000000000003','traveler','w1-outsider@example.test','O','active')
on conflict (id) do update set role=excluded.role, account_status=excluded.account_status;

insert into public.guide_profiles (user_id, slug, verification_status)
values ('71000000-0000-4000-8000-000000000002','w1-guide','approved')
on conflict (user_id) do nothing;

insert into public.traveler_requests (id, traveler_id, destination, region, status,
        participants_count, starts_on, ends_on)
values ('71000000-0000-4000-8000-0000000000a1','71000000-0000-4000-8000-000000000001',
        'Элиста','Калмыкия','booked',2,(now()+interval '10 days')::date,(now()+interval '12 days')::date);

insert into public.bookings (id, traveler_id, guide_id, request_id, status, party_size,
        subtotal_minor, currency, cancellation_policy_snapshot)
values ('71000000-0000-4000-8000-0000000000b1','71000000-0000-4000-8000-000000000001',
        '71000000-0000-4000-8000-000000000002','71000000-0000-4000-8000-0000000000a1',
        'awaiting_guide_confirmation',2,500000,'RUB','{}'::jsonb);

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated', true);

-- Direct INSERT with spoofed commercial fields is denied.
select set_config('request.jwt.claim.sub','71000000-0000-4000-8000-000000000001', true);
select throws_ok(
  $$insert into public.bookings (traveler_id, guide_id, status, subtotal_minor, currency, cancellation_policy_snapshot)
    values ('71000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000002',
            'confirmed',1,'RUB','{}')$$,
  'new row violates row-level security policy for table "bookings"',
  'traveler cannot insert a booking row directly');

-- Direct commercial-field UPDATE is denied (no rows changed).
update public.bookings set subtotal_minor = 1 where id = '71000000-0000-4000-8000-0000000000b1';
select is(
  (select subtotal_minor from public.bookings where id = '71000000-0000-4000-8000-0000000000b1'),
  500000,
  'party cannot patch booking commercial fields directly');

-- Direct arbitrary status UPDATE is denied (no rows changed).
update public.bookings set status = 'completed' where id = '71000000-0000-4000-8000-0000000000b1';
select is(
  (select status::text from public.bookings where id = '71000000-0000-4000-8000-0000000000b1'),
  'awaiting_guide_confirmation',
  'party cannot patch booking status directly');

-- Guide can transition through the guarded RPC.
select set_config('request.jwt.claim.sub','71000000-0000-4000-8000-000000000002', true);
select is(
  (select public.transition_booking(
    '71000000-0000-4000-8000-0000000000b1'::uuid,
    'confirmed'::public.booking_status)),
  'confirmed'::public.booking_status,
  'guide confirms via transition_booking');

-- Outsider cannot transition.
select set_config('request.jwt.claim.sub','71000000-0000-4000-8000-000000000003', true);
select throws_ok(
  $$select public.transition_booking(
      '71000000-0000-4000-8000-0000000000b1'::uuid,
      'cancelled'::public.booking_status)$$,
  'unauthorized',
  'outsider cannot transition a booking');

-- Illegal transition is rejected.
select set_config('request.jwt.claim.sub','71000000-0000-4000-8000-000000000002', true);
select throws_ok(
  $$select public.transition_booking(
      '71000000-0000-4000-8000-0000000000b1'::uuid,
      'pending'::public.booking_status)$$,
  'invalid_transition',
  'illegal transition is rejected');

-- Status unchanged after illegal attempt.
select is(
  (select status::text from public.bookings where id='71000000-0000-4000-8000-0000000000b1'),
  'confirmed',
  'status unchanged after rejected transition');

-- Guide can complete a confirmed booking.
select lives_ok(
  $$select public.transition_booking(
      '71000000-0000-4000-8000-0000000000b1'::uuid,
      'completed'::public.booking_status)$$,
  'guide completes via transition_booking');

select is(
  (select status::text from public.bookings where id='71000000-0000-4000-8000-0000000000b1'),
  'completed',
  'booking is completed');

select finish();
rollback;
