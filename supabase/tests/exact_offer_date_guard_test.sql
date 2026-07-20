begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(4);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  is_sso_user, confirmation_token, email_change, email_change_token_new, recovery_token)
values
  ('71000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'offer-date-traveler@example.test',
   extensions.crypt('x', extensions.gen_salt('bf')), now(), '{"provider":"email"}', '{}',
   now(), now(), false, '', '', '', ''),
  ('71000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'offer-date-guide@example.test',
   extensions.crypt('x', extensions.gen_salt('bf')), now(), '{"provider":"email"}', '{}',
   now(), now(), false, '', '', '', '');

insert into public.profiles (id, role, email, full_name, account_status)
values
  ('71000000-0000-4000-8000-000000000001', 'traveler', 'offer-date-traveler@example.test', 'Traveler', 'active'),
  ('71000000-0000-4000-8000-000000000002', 'guide', 'offer-date-guide@example.test', 'Guide', 'active');

insert into public.guide_profiles (user_id, slug, verification_status, is_available)
values ('71000000-0000-4000-8000-000000000002', 'offer-date-guide', 'approved', true);

insert into public.traveler_requests (
  id, traveler_id, destination, interests, starts_on, ends_on, budget_minor,
  participants_count, status, date_flexibility
)
values
  ('72000000-0000-4000-8000-000000000001', '71000000-0000-4000-8000-000000000001',
   'Exact', array['culture'], date '2026-11-10', date '2026-11-11', 100000, 1, 'open', 'exact'),
  ('72000000-0000-4000-8000-000000000002', '71000000-0000-4000-8000-000000000001',
   'Flexible', array['culture'], date '2026-11-10', date '2026-11-11', 100000, 1, 'open', 'few_days');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '71000000-0000-4000-8000-000000000002', true);

select throws_ok(
  $$
    insert into public.guide_offers (id, request_id, guide_id, price_minor, starts_at, ends_at)
    values ('73000000-0000-4000-8000-000000000001',
      '72000000-0000-4000-8000-000000000001',
      '71000000-0000-4000-8000-000000000002', 100000,
      '2026-11-11 09:00+03', '2026-11-11 12:00+03')
  $$,
  '23514',
  'offer_start_date_must_match_exact_request',
  'direct guide insert cannot move an exact request date'
);

select lives_ok(
  $$
    insert into public.guide_offers (id, request_id, guide_id, price_minor, starts_at, ends_at)
    values ('73000000-0000-4000-8000-000000000002',
      '72000000-0000-4000-8000-000000000001',
      '71000000-0000-4000-8000-000000000002', 100000,
      '2026-11-10 09:00+03', '2026-11-10 12:00+03')
  $$,
  'direct guide insert accepts the exact Moscow date'
);

select throws_ok(
  $$
    update public.guide_offers
       set starts_at = '2026-11-11 09:00+03'
     where id = '73000000-0000-4000-8000-000000000002'
  $$,
  '23514',
  'offer_start_date_must_match_exact_request',
  'direct guide update cannot move an exact request date'
);

select lives_ok(
  $$
    insert into public.guide_offers (id, request_id, guide_id, price_minor, starts_at, ends_at)
    values ('73000000-0000-4000-8000-000000000003',
      '72000000-0000-4000-8000-000000000002',
      '71000000-0000-4000-8000-000000000002', 100000,
      '2026-11-11 09:00+03', '2026-11-11 12:00+03')
  $$,
  'direct guide insert preserves few_days date variance'
);

select * from finish();
rollback;
