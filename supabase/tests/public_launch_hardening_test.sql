begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(9);

-- Seed one active approved guide, one suspended (but still approved) guide, and
-- one open traveler request with contact info in the free-text notes.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values
  ('6a000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'launch-guide-active@example.test',
   extensions.crypt('LaunchGuide123!', extensions.gen_salt('bf')), timezone('utc', now()),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
   timezone('utc', now()), timezone('utc', now()), false, '', '', '', ''),
  ('6a000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'launch-guide-suspended@example.test',
   extensions.crypt('LaunchGuide123!', extensions.gen_salt('bf')), timezone('utc', now()),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
   timezone('utc', now()), timezone('utc', now()), false, '', '', '', ''),
  ('6a000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'launch-traveler@example.test',
   extensions.crypt('LaunchTraveler123!', extensions.gen_salt('bf')), timezone('utc', now()),
   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
   timezone('utc', now()), timezone('utc', now()), false, '', '', '', '')
on conflict (id) do update set email = excluded.email, updated_at = excluded.updated_at;

insert into public.profiles (id, role, email, full_name, avatar_url, account_status)
values
  ('6a000000-0000-4000-8000-000000000001', 'guide', 'launch-guide-active@example.test', 'Launch Active Guide', 'active.jpg', 'active'),
  ('6a000000-0000-4000-8000-000000000002', 'guide', 'launch-guide-suspended@example.test', 'Launch Suspended Guide', 'suspended.jpg', 'suspended'),
  ('6a000000-0000-4000-8000-000000000003', 'traveler', 'launch-traveler@example.test', 'Launch Traveler', 'traveler.jpg', 'active')
on conflict (id) do update set
  role = excluded.role, full_name = excluded.full_name,
  avatar_url = excluded.avatar_url, account_status = excluded.account_status,
  updated_at = timezone('utc', now());

insert into public.guide_profiles (user_id, slug, bio, regions, verification_status, is_available)
values
  ('6a000000-0000-4000-8000-000000000001', 'launch-active-guide', 'Active bio', array['Москва'], 'approved', true),
  ('6a000000-0000-4000-8000-000000000002', 'launch-suspended-guide', 'Suspended bio', array['Москва'], 'approved', true)
on conflict (user_id) do update set
  slug = excluded.slug, verification_status = excluded.verification_status,
  is_available = excluded.is_available, updated_at = timezone('utc', now());

insert into public.traveler_requests (
  id, traveler_id, destination, region, interests, starts_on, ends_on,
  budget_minor, currency, participants_count, format_preference, notes,
  open_to_join, allow_guide_suggestions, group_capacity, status
)
values (
  '6b000000-0000-4000-8000-000000000001', '6a000000-0000-4000-8000-000000000003',
  'Казань', 'Татарстан', array['history_culture'], date '2026-09-01', date '2026-09-02',
  100000, 'RUB', 2, 'group', 'Напишите мне на mail@example.com или +7 999 123-45-67',
  true, true, 4, 'open'
)
on conflict (id) do update set notes = excluded.notes, status = excluded.status, updated_at = timezone('utc', now());

-- ---------------------------------------------------------------------------
-- Guide detail RPC: active guide resolves, suspended guide stays hidden.
-- ---------------------------------------------------------------------------
set local role anon;
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claim.sub', '', true);

select isnt_empty(
  $$ select 1 from public.get_public_guide_by_slug(array['launch-active-guide'])
       where user_id = '6a000000-0000-4000-8000-000000000001' and full_name = 'Launch Active Guide' $$,
  'anon resolves an active approved guide via get_public_guide_by_slug'
);

select is_empty(
  $$ select 1 from public.get_public_guide_by_slug(array['launch-suspended-guide']) $$,
  'get_public_guide_by_slug hides a suspended guide account'
);

select is_empty(
  $$ select 1 from public.get_public_guide_by_slug(array['no-such-slug']) $$,
  'get_public_guide_by_slug returns nothing for an unknown slug'
);

-- ---------------------------------------------------------------------------
-- Traveler requests: anon blocked on the raw table, allowed on the safe view.
-- ---------------------------------------------------------------------------
select is_empty(
  $$ select 1 from public.traveler_requests where id = '6b000000-0000-4000-8000-000000000001' $$,
  'anon cannot read raw traveler_requests rows'
);

select isnt_empty(
  $$ select 1 from public.v_public_open_requests where id = '6b000000-0000-4000-8000-000000000001' $$,
  'anon can read the sanitized public open-requests view'
);

-- The safe view must not expose the internal traveler_id column at all.
select is_empty(
  $$ select column_name from information_schema.columns
       where table_schema = 'public' and table_name = 'v_public_open_requests'
         and column_name = 'traveler_id' $$,
  'v_public_open_requests does not expose traveler_id'
);

-- Contact info in free-text notes is masked in the public view.
select is_empty(
  $$ select 1 from public.v_public_open_requests
       where id = '6b000000-0000-4000-8000-000000000001'
         and (notes ilike '%mail@example.com%' or notes like '%999 123-45-67%') $$,
  'v_public_open_requests masks email and phone in notes'
);

select isnt_empty(
  $$ select 1 from public.v_public_open_requests
       where id = '6b000000-0000-4000-8000-000000000001' and notes ilike '%контакт скрыт%' $$,
  'masked notes carry the redaction marker'
);

-- Authenticated guides still read open requests from the raw table for bidding.
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '6a000000-0000-4000-8000-000000000001', true);

select isnt_empty(
  $$ select 1 from public.traveler_requests where id = '6b000000-0000-4000-8000-000000000001' $$,
  'authenticated guides can still read open traveler requests directly'
);

select * from finish();

rollback;
