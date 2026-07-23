begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(3);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  is_sso_user, confirmation_token, email_change, email_change_token_new, recovery_token)
values
  ('75000000-0000-4000-8000-000000000011', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'moscow-expiry-traveler@example.test',
   extensions.crypt('x', extensions.gen_salt('bf')), now(), '{"provider":"email"}', '{}',
   now(), now(), false, '', '', '', ''),
  ('75000000-0000-4000-8000-000000000012', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'moscow-expiry-guide@example.test',
   extensions.crypt('x', extensions.gen_salt('bf')), now(), '{"provider":"email"}', '{}',
   now(), now(), false, '', '', '', '');

insert into public.profiles (id, role, email, full_name, account_status)
values
  ('75000000-0000-4000-8000-000000000011', 'traveler', 'moscow-expiry-traveler@example.test', 'Traveler', 'active'),
  ('75000000-0000-4000-8000-000000000012', 'guide', 'moscow-expiry-guide@example.test', 'Guide', 'active')
on conflict (id) do update set role = excluded.role, account_status = excluded.account_status;

insert into public.guide_profiles (user_id, slug, verification_status, is_available)
values ('75000000-0000-4000-8000-000000000012', 'moscow-expiry-guide', 'approved', true);

insert into public.traveler_requests (
  id, traveler_id, destination, interests, starts_on, ends_on, budget_minor,
  participants_count, status, date_flexibility
)
values
  ('75000000-0000-4000-8000-000000000011', '75000000-0000-4000-8000-000000000011',
   'Moscow expiry', array['culture'], current_date + 30, current_date + 31, 100000, 1, 'open', 'few_days');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '75000000-0000-4000-8000-000000000012', true);

-- 23:00 MSK on the Moscow calendar day — UTC midnight for that date would already be expired.
select set_config('timezone', 'UTC', true);

select lives_ok(
  $$
    insert into public.guide_offers (id, request_id, guide_id, price_minor, status, expires_at)
    values ('76000000-0000-4000-8000-000000000011',
      '75000000-0000-4000-8000-000000000011',
      '75000000-0000-4000-8000-000000000012', 100000, 'pending',
      ((current_date + 1)::text || 'T00:00:00Z')::timestamptz)
  $$,
  'UTC-midnight expiry is accepted when the Moscow day is still live'
);

select is(
  (
    select expires_at
    from public.guide_offers
    where id = '76000000-0000-4000-8000-000000000011'
  ),
  (
    ((current_date + 1)::text || ' 23:59:59.999')::timestamp AT TIME ZONE 'Europe/Moscow'
  ),
  'UTC-midnight expiry is stored as the end of that Moscow calendar day'
);

select is(
  public.normalize_offer_expires_at('2026-07-25T20:59:59.999Z'::timestamptz),
  '2026-07-25T20:59:59.999Z'::timestamptz,
  'already-normalized timestamps pass through unchanged'
);

select * from finish();
rollback;
