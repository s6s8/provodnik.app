-- Wave 1 #57: payment agreement integrity at the DB boundary.
begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(7);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  is_sso_user, confirmation_token, email_change, email_change_token_new, recovery_token)
values
  ('72000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','pa-trav@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),'{"provider":"email"}','{}', now(), now(), false,'','','',''),
  ('72000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','pa-guide@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),'{"provider":"email"}','{}', now(), now(), false,'','','','');

insert into public.profiles (id, role, email, full_name, account_status)
values
  ('72000000-0000-4000-8000-000000000001','traveler','pa-trav@example.test','T','active'),
  ('72000000-0000-4000-8000-000000000002','guide','pa-guide@example.test','G','active')
on conflict (id) do update set role=excluded.role, account_status=excluded.account_status;

insert into public.bookings (id, traveler_id, guide_id, status, party_size,
        subtotal_minor, currency, cancellation_policy_snapshot)
values ('72000000-0000-4000-8000-0000000000b1','72000000-0000-4000-8000-000000000001',
        '72000000-0000-4000-8000-000000000002','confirmed',2,500000,'RUB','{}'::jsonb);

insert into public.payment_agreements (booking_id, agreed_total_minor, currency, method)
values ('72000000-0000-4000-8000-0000000000b1',500000,'RUB','in_person');

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated', true);

-- Direct INSERT is denied.
select set_config('request.jwt.claim.sub','72000000-0000-4000-8000-000000000001', true);
select throws_ok(
  $$insert into public.payment_agreements (booking_id, agreed_total_minor, currency, method)
    values ('72000000-0000-4000-8000-0000000000b1',1,'RUB','in_person')$$,
  'new row violates row-level security policy for table "payment_agreements"',
  'party cannot insert payment_agreements directly');

-- Direct commercial-field UPDATE is denied (no rows changed).
update public.payment_agreements set agreed_total_minor = 1
  where booking_id = '72000000-0000-4000-8000-0000000000b1';
select is(
  (select agreed_total_minor from public.payment_agreements
    where booking_id='72000000-0000-4000-8000-0000000000b1'),
  500000,
  'party cannot patch agreed_total_minor directly');

-- Traveler confirms through RPC.
select lives_ok(
  $$select public.confirm_payment_agreement('72000000-0000-4000-8000-0000000000b1')$$,
  'traveler confirms via confirm_payment_agreement');

select isnt(
  (select traveler_confirmed_at from public.payment_agreements
    where booking_id='72000000-0000-4000-8000-0000000000b1'),
  null,
  'traveler_confirmed_at is stamped');

-- Guide confirms through RPC.
select set_config('request.jwt.claim.sub','72000000-0000-4000-8000-000000000002', true);
select lives_ok(
  $$select public.confirm_payment_agreement('72000000-0000-4000-8000-0000000000b1')$$,
  'guide confirms via confirm_payment_agreement');

select isnt(
  (select guide_confirmed_at from public.payment_agreements
    where booking_id='72000000-0000-4000-8000-0000000000b1'),
  null,
  'guide_confirmed_at is stamped');

-- Agreed total remains authoritative.
select is(
  (select agreed_total_minor from public.payment_agreements
    where booking_id='72000000-0000-4000-8000-0000000000b1'),
  500000,
  'agreed_total_minor unchanged after confirmations');

select finish();
rollback;
