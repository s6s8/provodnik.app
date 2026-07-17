-- Owner 609 P0: accept_offer is the single atomic authority for accepting an offer.
-- Proves it derives guide/price from the offer row (client cannot spoof), books
-- the request, declines siblings, and yields exactly one booking even on re-accept.
begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(9);

-- traveler (request owner), guide A (the real offer), guide B (a spoof target).
insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  is_sso_user, confirmation_token, email_change, email_change_token_new, recovery_token)
values
  ('63000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','ao-trav@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),'{"provider":"email"}','{}', now(), now(), false,'','','',''),
  ('63000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','ao-guideA@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),'{"provider":"email"}','{}', now(), now(), false,'','','',''),
  ('63000000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','ao-guideB@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),'{"provider":"email"}','{}', now(), now(), false,'','','','');

insert into public.profiles (id, role, email, full_name, account_status)
values
  ('63000000-0000-4000-8000-000000000001','traveler','ao-trav@example.test','T','active'),
  ('63000000-0000-4000-8000-000000000002','guide','ao-guideA@example.test','GA','active'),
  ('63000000-0000-4000-8000-000000000003','guide','ao-guideB@example.test','GB','active')
on conflict (id) do update set role=excluded.role, account_status=excluded.account_status;

insert into public.guide_profiles (user_id, slug, verification_status)
values ('63000000-0000-4000-8000-000000000002','ao-guide-a','approved'),
       ('63000000-0000-4000-8000-000000000003','ao-guide-b','approved')
on conflict (user_id) do nothing;

insert into public.traveler_requests (id, traveler_id, destination, region, status,
        participants_count, starts_on, ends_on)
values ('63000000-0000-4000-8000-0000000000a1',
        '63000000-0000-4000-8000-000000000001','Элиста','Калмыкия','open',2,
        (now() + interval '14 days')::date, (now() + interval '16 days')::date);

-- Two pending offers on the request: guide A @ 500000, guide B @ 900000.
insert into public.guide_offers (id, request_id, guide_id, price_minor, currency, status)
values
  ('63000000-0000-4000-8000-0000000000f1','63000000-0000-4000-8000-0000000000a1',
   '63000000-0000-4000-8000-000000000002',500000,'RUB','pending'),
  ('63000000-0000-4000-8000-0000000000f2','63000000-0000-4000-8000-0000000000a1',
   '63000000-0000-4000-8000-000000000003',900000,'RUB','pending');

-- Act as the traveler (request owner).
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated', true);
select set_config('request.jwt.claim.sub','63000000-0000-4000-8000-000000000001', true);

-- 1. Accept offer f1 succeeds and returns a booking id.
select isnt(
  (select public.accept_offer('63000000-0000-4000-8000-0000000000f1')),
  null,
  'accept_offer returns a booking id');

-- 2. Exactly one booking exists for the request.
select is(
  (select count(*)::int from public.bookings where request_id='63000000-0000-4000-8000-0000000000a1'),
  1, 'exactly one booking created');

-- 3. Booking carries the OFFER's guide + price, never a client value.
select is(
  (select guide_id::text || ':' || subtotal_minor::text from public.bookings
     where request_id='63000000-0000-4000-8000-0000000000a1'),
  '63000000-0000-4000-8000-000000000002:500000',
  'booking uses guide A and price 500000 from the offer row');

-- 4. Accepted offer is f1.
select is(
  (select status::text from public.guide_offers where id='63000000-0000-4000-8000-0000000000f1'),
  'accepted', 'chosen offer is accepted');

-- 5. Sibling offer f2 was declined.
select is(
  (select status::text from public.guide_offers where id='63000000-0000-4000-8000-0000000000f2'),
  'declined', 'sibling offer declined');

-- 6. Request is booked.
select is(
  (select status::text from public.traveler_requests where id='63000000-0000-4000-8000-0000000000a1'),
  'booked', 'request marked booked');

-- 7. A payment agreement was seeded for the booking.
select is(
  (select count(*)::int from public.payment_agreements pa
     join public.bookings b on b.id = pa.booking_id
    where b.request_id='63000000-0000-4000-8000-0000000000a1'),
  1, 'payment agreement seeded');

-- 8. Re-accepting the now-accepted offer fails (no second booking) — one winner.
select throws_ok(
  $$select public.accept_offer('63000000-0000-4000-8000-0000000000f1')$$,
  'offer_not_found',
  'second accept of the same offer is rejected');

-- 9. Accepting the declined sibling also fails — still exactly one booking.
select throws_ok(
  $$select public.accept_offer('63000000-0000-4000-8000-0000000000f2')$$,
  'offer_not_found',
  'accepting a declined sibling is rejected');

select finish();
rollback;
