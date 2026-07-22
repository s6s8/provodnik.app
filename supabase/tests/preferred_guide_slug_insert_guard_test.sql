-- #39 regression — preferred_guide_slug is not a direct-insert authority.
--
-- A traveler's browser-held token can call PostgREST directly. These assertions pin the
-- boundary: preferred_guide_slug may only be written by create_directed_traveler_request,
-- which resolves it to target_guide_id. An unresolved slug must never reach public discovery.

begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(5);

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  is_sso_user,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values
  (
    '6d100000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'slug-guard-traveler@example.test',
    extensions.crypt('SlugGuardTraveler123!', extensions.gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    timezone('utc', now()),
    timezone('utc', now()),
    false,
    '',
    '',
    '',
    ''
  ),
  (
    '6d100000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'slug-guard-guide@example.test',
    extensions.crypt('SlugGuardGuide123!', extensions.gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    timezone('utc', now()),
    timezone('utc', now()),
    false,
    '',
    '',
    '',
    ''
  )
on conflict (id) do update set
  email = excluded.email,
  updated_at = excluded.updated_at;

insert into public.profiles (id, role, email, full_name, account_status)
values
  ('6d100000-0000-4000-8000-000000000001', 'traveler', 'slug-guard-traveler@example.test', 'Slug Guard Traveler', 'active'),
  ('6d100000-0000-4000-8000-000000000002', 'guide', 'slug-guard-guide@example.test', 'Slug Guard Guide', 'active')
on conflict (id) do update set
  role = excluded.role,
  account_status = excluded.account_status,
  updated_at = timezone('utc', now());

insert into public.guide_profiles (user_id, slug, verification_status)
values
  ('6d100000-0000-4000-8000-000000000002', 'slug-guard-guide', 'approved')
on conflict (user_id) do update set
  slug = excluded.slug,
  verification_status = excluded.verification_status,
  updated_at = timezone('utc', now());

-- Act as the traveler, exactly as the browser's own token would.
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '6d100000-0000-4000-8000-000000000001', true);

-- 1. Unresolved slug direct insert is rejected.
select throws_ok(
  $$insert into public.traveler_requests
      (traveler_id, preferred_guide_slug, destination, starts_on, ends_on, participants_count)
    values ('6d100000-0000-4000-8000-000000000001',
            'ghost-guide',
            'Ghost Slug Bypass', date '2026-09-01', date '2026-09-02', 2)$$,
  '42501',
  'new row violates row-level security policy for table "traveler_requests"',
  'traveler cannot directly insert a preferred_guide_slug'
);

-- 2. No forged row becomes public.
select is_empty(
  $$select 1 from public.v_public_open_requests where destination = 'Ghost Slug Bypass'$$,
  'unresolved slug bypass never reaches public open-requests view'
);

-- 3. Ordinary open requests are untouched.
select lives_ok(
  $$insert into public.traveler_requests
      (id, traveler_id, destination, starts_on, ends_on, participants_count)
    values ('6f100000-0000-4000-8000-000000000001',
            '6d100000-0000-4000-8000-000000000001',
            'Ordinary Slug-Guard Open Request', date '2026-09-01', date '2026-09-02', 2)$$,
  'traveler can still directly insert an undirected open request'
);

-- 4. Resolved personal requests still go through the RPC and stay non-public.
select is(
  (select (public.create_directed_traveler_request(
      p_destination => 'RPC Slug Directed Request',
      p_starts_on => date '2026-09-05',
      p_ends_on => date '2026-09-06',
      p_preferred_guide_slug => 'slug-guard-guide'
    )).target_guide_id),
  '6d100000-0000-4000-8000-000000000002'::uuid,
  'RPC still resolves an approved guide slug to the addressee'
);

select is_empty(
  $$select 1 from public.v_public_open_requests
     where destination in ('RPC Slug Directed Request', 'Ghost Slug Bypass')$$,
  'only the undirected request reaches the public open-requests view'
);

select * from finish();
rollback;
