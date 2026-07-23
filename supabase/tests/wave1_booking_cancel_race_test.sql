-- Wave 1 #62: traveler cancellation cannot overwrite a concurrent completion.
begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(5);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  is_sso_user, confirmation_token, email_change, email_change_token_new, recovery_token)
values
  ('73000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','rc-trav@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),'{"provider":"email"}','{}', now(), now(), false,'','','',''),
  ('73000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','rc-guide@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),'{"provider":"email"}','{}', now(), now(), false,'','','','');

insert into public.profiles (id, role, email, full_name, account_status)
values
  ('73000000-0000-4000-8000-000000000001','traveler','rc-trav@example.test','T','active'),
  ('73000000-0000-4000-8000-000000000002','guide','rc-guide@example.test','G','active')
on conflict (id) do update set role=excluded.role, account_status=excluded.account_status;

insert into public.bookings (id, traveler_id, guide_id, status, party_size,
        subtotal_minor, currency, cancellation_policy_snapshot)
values ('73000000-0000-4000-8000-0000000000b1','73000000-0000-4000-8000-000000000001',
        '73000000-0000-4000-8000-000000000002','confirmed',2,500000,'RUB','{}'::jsonb);

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated', true);

-- Simulate guide completion winning the race first.
select set_config('request.jwt.claim.sub','73000000-0000-4000-8000-000000000002', true);
select is(
  (select public.transition_booking(
    '73000000-0000-4000-8000-0000000000b1'::uuid,
    'completed'::public.booking_status)),
  'completed'::public.booking_status,
  'guide completes the booking');

-- Traveler cancel attempt after completion is rejected.
select set_config('request.jwt.claim.sub','73000000-0000-4000-8000-000000000001', true);
select throws_ok(
  $$select public.cancel_booking_as_traveler('73000000-0000-4000-8000-0000000000b1')$$,
  'concurrent_completion',
  'traveler cancel is rejected once booking is completed');

-- Status remains completed.
select is(
  (select status::text from public.bookings where id='73000000-0000-4000-8000-0000000000b1'),
  'completed',
  'completed status is preserved');

-- A cancellable booking can still be cancelled by the traveler.
reset role;
update public.bookings set status = 'confirmed' where id = '73000000-0000-4000-8000-0000000000b1';
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated', true);

select lives_ok(
  $$select public.cancel_booking_as_traveler('73000000-0000-4000-8000-0000000000b1')$$,
  'traveler cancels a confirmed booking through RPC');

select is(
  (select status::text from public.bookings where id='73000000-0000-4000-8000-0000000000b1'),
  'cancelled',
  'booking is cancelled when still cancellable');

select finish();
rollback;
