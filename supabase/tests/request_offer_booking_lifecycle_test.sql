-- #75: request → offer → booking lifecycle — single chained regression on local Postgres.
-- Exercises RLS insert paths (request, offer) and RPC authority (accept_offer,
-- transition_booking) without production credentials or service-role shortcuts.
begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(11);

-- traveler (request owner) and guide (approved, available bidder).
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  is_sso_user, confirmation_token, email_change, email_change_token_new, recovery_token
)
values
  ('76000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'lob-trav@example.test',
   extensions.crypt('x', extensions.gen_salt('bf')), timezone('utc', now()),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
   timezone('utc', now()), timezone('utc', now()), false, '', '', '', ''),
  ('76000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'lob-guide@example.test',
   extensions.crypt('x', extensions.gen_salt('bf')), timezone('utc', now()),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
   timezone('utc', now()), timezone('utc', now()), false, '', '', '', '')
on conflict (id) do update set email = excluded.email, updated_at = excluded.updated_at;

insert into public.profiles (id, role, email, full_name, account_status)
values
  ('76000000-0000-4000-8000-000000000001', 'traveler', 'lob-trav@example.test', 'LOB Traveler', 'active'),
  ('76000000-0000-4000-8000-000000000002', 'guide', 'lob-guide@example.test', 'LOB Guide', 'active')
on conflict (id) do update set role = excluded.role, account_status = excluded.account_status;

insert into public.guide_profiles (user_id, slug, verification_status, is_available, base_city)
values ('76000000-0000-4000-8000-000000000002', 'lob-guide', 'approved', true, 'Элиста')
on conflict (user_id) do update set verification_status = 'approved', is_available = true;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);

-- 1. Traveler creates an open request through RLS (browser-held session path).
select set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$ insert into public.traveler_requests (
       id, traveler_id, destination, region, starts_on, ends_on, participants_count, status,
       date_flexibility
     ) values (
       '76000000-0000-4000-8000-0000000000a1',
       '76000000-0000-4000-8000-000000000001',
       'Элиста', 'Калмыкия',
       current_date + 14, current_date + 16,
       2, 'open', 'few_days'
     ) $$,
  'traveler can insert an open request via RLS'
);

-- 2. Guide submits a pending offer through RLS.
select set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000002', true);
select lives_ok(
  $$ insert into public.guide_offers (
       id, request_id, guide_id, price_minor, currency, status, starts_at, ends_at, expires_at
     ) values (
       '76000000-0000-4000-8000-0000000000f1',
       '76000000-0000-4000-8000-0000000000a1',
       '76000000-0000-4000-8000-000000000002',
       500000, 'RUB', 'pending',
       ((current_date + 14)::date + time '10:00') at time zone 'Europe/Moscow',
       ((current_date + 14)::date + time '14:00') at time zone 'Europe/Moscow',
       timezone('utc', now()) + interval '7 days'
     ) $$,
  'guide can insert a pending offer via RLS'
);

-- 3. Traveler accepts the offer — accept_offer is the single booking authority.
select set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000001', true);
select isnt(
  (select public.accept_offer('76000000-0000-4000-8000-0000000000f1')),
  null,
  'accept_offer returns a booking id'
);

-- 4. Booking lands in awaiting_guide_confirmation with offer-derived commercial fields.
select is(
  (select status::text || ':' || guide_id::text || ':' || subtotal_minor::text
     from public.bookings
    where request_id = '76000000-0000-4000-8000-0000000000a1'),
  'awaiting_guide_confirmation:76000000-0000-4000-8000-000000000002:500000',
  'booking status and commercial fields come from the accepted offer'
);

-- 5. Offer and request lifecycle columns move forward atomically.
select is(
  (select status::text from public.guide_offers where id = '76000000-0000-4000-8000-0000000000f1'),
  'accepted',
  'accepted offer is marked accepted'
);

select is(
  (select status::text from public.traveler_requests where id = '76000000-0000-4000-8000-0000000000a1'),
  'booked',
  'request is marked booked'
);

-- 6. Side effects seeded by accept_offer: payment agreement + booking thread.
select is(
  (select count(*)::int
     from public.payment_agreements pa
     join public.bookings b on b.id = pa.booking_id
    where b.request_id = '76000000-0000-4000-8000-0000000000a1'),
  1,
  'payment agreement is seeded for the booking'
);

select is(
  (select count(*)::int
     from public.conversation_threads ct
     join public.bookings b on b.id = ct.booking_id
    where b.request_id = '76000000-0000-4000-8000-0000000000a1'
      and ct.subject_type = 'booking'),
  1,
  'booking conversation thread is created'
);

-- 7. Guide confirms and completes through transition_booking (no direct status PATCH).
select set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000002', true);
select is(
  (select public.transition_booking(
     (select id from public.bookings where request_id = '76000000-0000-4000-8000-0000000000a1'),
     'confirmed'::public.booking_status))::text,
  'confirmed',
  'guide confirms the booking via transition_booking'
);

select lives_ok(
  $$ select public.transition_booking(
       (select id from public.bookings where request_id = '76000000-0000-4000-8000-0000000000a1'),
       'completed'::public.booking_status) $$,
  'guide completes the booking via transition_booking'
);

select is(
  (select status::text from public.bookings where request_id = '76000000-0000-4000-8000-0000000000a1'),
  'completed',
  'booking ends in completed status'
);

select finish();
rollback;
