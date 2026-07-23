-- Privacy acceptance batch (#58, #82, #88).
begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(9);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  is_sso_user, confirmation_token, email_change, email_change_token_new, recovery_token
)
values
  ('8a000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'privacy-owner@example.test',
   extensions.crypt('PrivacyOwner123!', extensions.gen_salt('bf')), timezone('utc', now()),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
   timezone('utc', now()), timezone('utc', now()), false, '', '', '', ''),
  ('8a000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'privacy-addressed@example.test',
   extensions.crypt('PrivacyAddressed123!', extensions.gen_salt('bf')), timezone('utc', now()),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
   timezone('utc', now()), timezone('utc', now()), false, '', '', '', ''),
  ('8a000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'privacy-outsider@example.test',
   extensions.crypt('PrivacyOutsider123!', extensions.gen_salt('bf')), timezone('utc', now()),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
   timezone('utc', now()), timezone('utc', now()), false, '', '', '', '')
on conflict (id) do update set email = excluded.email, updated_at = excluded.updated_at;

insert into public.profiles (id, role, email, full_name, account_status)
values
  ('8a000000-0000-4000-8000-000000000001', 'traveler', 'privacy-owner@example.test', 'Privacy Owner', 'active'),
  ('8a000000-0000-4000-8000-000000000002', 'guide', 'privacy-addressed@example.test', 'Privacy Addressed Guide', 'active'),
  ('8a000000-0000-4000-8000-000000000003', 'guide', 'privacy-outsider@example.test', 'Privacy Outsider Guide', 'active')
on conflict (id) do update set role = excluded.role, account_status = excluded.account_status;

insert into public.guide_profiles (user_id, slug, verification_status, is_available)
values
  ('8a000000-0000-4000-8000-000000000002', 'privacy-addressed-guide', 'approved', true),
  ('8a000000-0000-4000-8000-000000000003', 'privacy-outsider-guide', 'approved', true)
on conflict (user_id) do update set verification_status = 'approved', is_available = true;

insert into public.guide_templates (
  id, guide_id, title, description, duration_text, meeting_point,
  max_participants, region, category, status, price_from_kopecks, price_scope, photo_urls
)
values (
  '8d000000-0000-4000-8000-000000000001',
  '8a000000-0000-4000-8000-000000000002',
  'Степная прогулка',
  'Приватное место встречи',
  '4 часа',
  'Секретная площадь, 1',
  6,
  'Калмыкия',
  'Культура',
  'published',
  450000,
  'per_group',
  array['https://cdn.example/photo.jpg']
)
on conflict (id) do update set meeting_point = excluded.meeting_point, status = excluded.status;

insert into public.traveler_requests (
  id, traveler_id, destination, region, interests, starts_on, ends_on, budget_minor,
  currency, participants_count, format_preference, notes, open_to_join, status, target_guide_id,
  date_flexibility
)
values
  ('8b000000-0000-4000-8000-000000000001', '8a000000-0000-4000-8000-000000000001',
   'Directed Private', 'Test', array['culture'], current_date + 20, current_date + 21,
   100000, 'RUB', 4, 'Private', 'Directed notes', false, 'open',
   '8a000000-0000-4000-8000-000000000002', 'few_days'),
  ('8b000000-0000-4000-8000-000000000002', '8a000000-0000-4000-8000-000000000001',
   'Public Assembly', 'Test', array['culture'], current_date + 20, current_date + 21,
   100000, 'RUB', 2, 'group', 'Public notes', true, 'open', null, 'few_days'),
  ('8b000000-0000-4000-8000-000000000003', '8a000000-0000-4000-8000-000000000001',
   'Closed Private', 'Test', array['culture'], current_date + 20, current_date + 21,
   100000, 'RUB', 5, 'Private', 'Closed notes', false, 'open', null, 'few_days')
on conflict (id) do update set
  participants_count = excluded.participants_count,
  open_to_join = excluded.open_to_join,
  format_preference = excluded.format_preference,
  target_guide_id = excluded.target_guide_id,
  status = excluded.status;

insert into public.guide_offers (
  id, request_id, guide_id, price_minor, currency, status, starts_at, ends_at, expires_at, capacity
)
values (
  '8c000000-0000-4000-8000-000000000001', '8b000000-0000-4000-8000-000000000003',
  '8a000000-0000-4000-8000-000000000003', 100000, 'RUB', 'pending',
  ((current_date + 20)::date + time '10:00') at time zone 'Europe/Moscow',
  ((current_date + 20)::date + time '14:00') at time zone 'Europe/Moscow',
  timezone('utc', now()) + interval '7 days',
  5
)
on conflict (id) do update set status = excluded.status, capacity = excluded.capacity;

-- #58: public ready-excursion projection omits meeting_point.
set local role anon;
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claim.sub', '', true);

select is_empty(
  $$ select 1
       from information_schema.columns
      where table_schema = 'public'
        and table_name = 'v_public_published_guide_templates'
        and column_name = 'meeting_point' $$,
  'public published template view does not expose meeting_point'
);

select isnt_empty(
  $$ select 1
       from public.v_public_published_guide_templates
      where id = '8d000000-0000-4000-8000-000000000001'
        and title = 'Степная прогулка' $$,
  'anon can read the published template through the public projection'
);

select is_empty(
  $$ select 1
       from public.guide_templates
      where id = '8d000000-0000-4000-8000-000000000001'
        and meeting_point = 'Секретная площадь, 1' $$,
  'anon cannot read meeting_point from the raw guide_templates table'
);

-- #88: closed requests stay out of the public discovery view.
select is_empty(
  $$ select 1
       from public.v_public_open_requests
      where id = '8b000000-0000-4000-8000-000000000003' $$,
  'closed private requests are excluded from v_public_open_requests'
);

select isnt_empty(
  $$ select 1
       from public.v_public_open_requests
      where id = '8b000000-0000-4000-8000-000000000002' $$,
  'joinable assembly requests remain in v_public_open_requests'
);

-- #82: directed request stays invisible to unrelated guides in direct reads.
select set_config('request.jwt.claim.sub', '8a000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is_empty(
  $$ select 1 from public.traveler_requests where id = '8b000000-0000-4000-8000-000000000001' $$,
  'unrelated guide cannot read a directed request through traveler_requests'
);

select set_config('request.jwt.claim.sub', '8a000000-0000-4000-8000-000000000002', true);
select isnt_empty(
  $$ select 1 from public.traveler_requests where id = '8b000000-0000-4000-8000-000000000001' $$,
  'addressed guide can read their directed request through traveler_requests'
);

-- #88: unrelated guide cannot read a competitor offer's capacity on a closed request.
select set_config('request.jwt.claim.sub', '8a000000-0000-4000-8000-000000000002', true);
select is_empty(
  $$ select capacity
       from public.guide_offers
      where id = '8c000000-0000-4000-8000-000000000001' $$,
  'unrelated guide cannot read another guide offer capacity on a closed request'
);

select set_config('request.jwt.claim.sub', '8a000000-0000-4000-8000-000000000003', true);
select isnt_empty(
  $$ select capacity
       from public.guide_offers
      where id = '8c000000-0000-4000-8000-000000000001'
        and capacity = 5 $$,
  'responding guide can read their own offer capacity on a closed request'
);

select * from finish();
rollback;
