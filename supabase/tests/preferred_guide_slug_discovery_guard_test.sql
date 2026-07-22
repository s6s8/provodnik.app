-- #39 regression — directed-request discovery and preferred_guide_slug update boundaries.
--
-- A browser-held token can SELECT/UPDATE traveler_requests directly. These assertions pin
-- the lower boundary: only genuinely public open requests are discoverable to unrelated
-- authenticated users; owner and addressed guide retain access; preferred_guide_slug is
-- immutable after creation; legacy unresolved slug rows never leak.

begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(13);

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
    '6d200000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'discovery-traveler@example.test',
    extensions.crypt('DiscoveryTraveler123!', extensions.gen_salt('bf')),
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
    '6d200000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'discovery-guide@example.test',
    extensions.crypt('DiscoveryGuide123!', extensions.gen_salt('bf')),
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
    '6d200000-0000-4000-8000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'discovery-outsider@example.test',
    extensions.crypt('DiscoveryOutsider123!', extensions.gen_salt('bf')),
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
  ('6d200000-0000-4000-8000-000000000001', 'traveler', 'discovery-traveler@example.test', 'Discovery Traveler', 'active'),
  ('6d200000-0000-4000-8000-000000000002', 'guide', 'discovery-guide@example.test', 'Discovery Guide', 'active'),
  ('6d200000-0000-4000-8000-000000000003', 'guide', 'discovery-outsider@example.test', 'Discovery Outsider', 'active')
on conflict (id) do update set
  role = excluded.role,
  account_status = excluded.account_status,
  updated_at = timezone('utc', now());

insert into public.guide_profiles (user_id, slug, verification_status)
values
  ('6d200000-0000-4000-8000-000000000002', 'discovery-guide', 'approved')
on conflict (user_id) do update set
  slug = excluded.slug,
  verification_status = excluded.verification_status,
  updated_at = timezone('utc', now());

-- Act as the traveler, exactly as the browser's own token would.
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '6d200000-0000-4000-8000-000000000001', true);

select lives_ok(
  $$insert into public.traveler_requests
      (id, traveler_id, destination, starts_on, ends_on, participants_count)
    values ('6f200000-0000-4000-8000-000000000001',
            '6d200000-0000-4000-8000-000000000001',
            'Discovery Ordinary Open Request', date '2026-09-01', date '2026-09-02', 2)$$,
  'traveler can still directly insert an undirected open request'
);

select is(
  (select (public.create_directed_traveler_request(
      p_destination => 'Discovery Directed Request',
      p_starts_on => date '2026-09-05',
      p_ends_on => date '2026-09-06',
      p_preferred_guide_slug => 'discovery-guide'
    )).target_guide_id),
  '6d200000-0000-4000-8000-000000000002'::uuid,
  'RPC still resolves an approved guide slug to the addressee'
);

-- Seed a legacy-shaped unresolved slug row the way pre-remediation data could exist.
reset role;
insert into public.traveler_requests (
  id,
  traveler_id,
  preferred_guide_slug,
  destination,
  starts_on,
  ends_on,
  participants_count
)
values (
  '6f200000-0000-4000-8000-000000000099',
  '6d200000-0000-4000-8000-000000000001',
  'ghost-legacy-guide',
  'Discovery Legacy Unresolved Slug Request',
  date '2026-09-07',
  date '2026-09-08',
  2
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '6d200000-0000-4000-8000-000000000003', true);

-- 1. Unrelated authenticated users cannot read a resolved directed request.
select is_empty(
  $$select 1 from public.traveler_requests
     where destination = 'Discovery Directed Request'$$,
  'unrelated authenticated user cannot SELECT a resolved directed request'
);

-- 2. Unrelated authenticated users cannot read a legacy unresolved slug row.
select is_empty(
  $$select 1 from public.traveler_requests
     where destination = 'Discovery Legacy Unresolved Slug Request'$$,
  'unrelated authenticated user cannot SELECT a legacy unresolved slug row'
);

-- 3. Unrelated users still discover ordinary public requests.
select isnt_empty(
  $$select 1 from public.traveler_requests
     where destination = 'Discovery Ordinary Open Request'$$,
  'ordinary public request remains discoverable to unrelated authenticated users'
);

-- 4. Owner retains access to their directed request.
select set_config('request.jwt.claim.sub', '6d200000-0000-4000-8000-000000000001', true);

select isnt_empty(
  $$select 1 from public.traveler_requests
     where destination = 'Discovery Directed Request'$$,
  'owner can still SELECT their resolved directed request'
);

-- 5. Addressed guide retains access to the directed request.
select set_config('request.jwt.claim.sub', '6d200000-0000-4000-8000-000000000002', true);

select isnt_empty(
  $$select 1 from public.traveler_requests
     where destination = 'Discovery Directed Request'$$,
  'addressed guide can still SELECT the directed request'
);

-- 6. Owner cannot PATCH preferred_guide_slug onto an ordinary request.
select set_config('request.jwt.claim.sub', '6d200000-0000-4000-8000-000000000001', true);

select throws_ok(
  $$update public.traveler_requests
       set preferred_guide_slug = 'discovery-guide'
     where id = '6f200000-0000-4000-8000-000000000001'$$,
  'preferred_guide_slug_not_editable',
  'traveler cannot PATCH preferred_guide_slug onto an existing request'
);

-- 7. Ordinary edits of an own request keep working.
select lives_ok(
  $$update public.traveler_requests set notes = 'edited'
     where id = '6f200000-0000-4000-8000-000000000001'$$,
  'traveler can still edit other fields of their own request'
);

-- 8. Public view excludes directed and legacy unresolved slug rows.
select results_eq(
  $$select destination from public.v_public_open_requests
     where destination in (
       'Discovery Ordinary Open Request',
       'Discovery Directed Request',
       'Discovery Legacy Unresolved Slug Request'
     )
     order by destination$$,
  $$values ('Discovery Ordinary Open Request'::text)$$,
  'only the undirected request reaches the public open-requests view'
);

-- 9. request_is_discoverable matches the tightened public boundary.
select is(
  public.request_is_discoverable('6f200000-0000-4000-8000-000000000001'),
  true,
  'ordinary open request is discoverable'
);

select is(
  public.request_is_discoverable(
    (select id from public.traveler_requests
      where destination = 'Discovery Directed Request')
  ),
  false,
  'resolved directed request is not discoverable'
);

select is(
  public.request_is_discoverable('6f200000-0000-4000-8000-000000000099'),
  false,
  'legacy unresolved slug row is not discoverable'
);

select * from finish();
rollback;
