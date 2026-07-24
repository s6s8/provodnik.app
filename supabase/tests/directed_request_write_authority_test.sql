-- Item 8 follow-up — the directed-request addressee is the database's authority.
--
-- The app writes traveler requests with the browser's own session, so anything the
-- server action can send, a hand-rolled PostgREST call can send too. These assertions
-- pin the boundary: a traveler's direct insert may only create an ordinary open request,
-- and target_guide_id can only be set by create_directed_traveler_request, which derives
-- it from a published listing or an approved guide slug.

begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(9);

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
    '6d000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'directed-traveler@example.test',
    extensions.crypt('DirectedTraveler123!', extensions.gen_salt('bf')),
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
    '6d000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'directed-guide@example.test',
    extensions.crypt('DirectedGuide123!', extensions.gen_salt('bf')),
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
    '6d000000-0000-4000-8000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'directed-pending-guide@example.test',
    extensions.crypt('DirectedPending123!', extensions.gen_salt('bf')),
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
  ('6d000000-0000-4000-8000-000000000001', 'traveler', 'directed-traveler@example.test', 'Directed Traveler', 'active'),
  ('6d000000-0000-4000-8000-000000000002', 'guide', 'directed-guide@example.test', 'Directed Guide', 'active'),
  ('6d000000-0000-4000-8000-000000000003', 'guide', 'directed-pending-guide@example.test', 'Pending Guide', 'active')
on conflict (id) do update set
  role = excluded.role,
  account_status = excluded.account_status,
  updated_at = timezone('utc', now());

insert into public.guide_profiles (user_id, slug, verification_status)
values
  ('6d000000-0000-4000-8000-000000000002', 'directed-guide', 'approved'),
  ('6d000000-0000-4000-8000-000000000003', 'directed-pending-guide', 'submitted')
on conflict (user_id) do update set
  slug = excluded.slug,
  verification_status = excluded.verification_status,
  updated_at = timezone('utc', now());

insert into public.listings (id, guide_id, slug, title, region, category, price_from_minor, status)
values
  ('6e000000-0000-4000-8000-0000000000aa',
   '6d000000-0000-4000-8000-000000000002',
   'directed-published-listing', 'Directed Tour', 'Калмыкия', 'excursion', 100000, 'published'),
  ('6e000000-0000-4000-8000-0000000000bb',
   '6d000000-0000-4000-8000-000000000002',
   'directed-draft-listing', 'Unpublished Tour', 'Калмыкия', 'excursion', 100000, 'draft')
on conflict (id) do update set status = excluded.status;

-- Act as the traveler, exactly as the browser's own token would.
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '6d000000-0000-4000-8000-000000000001', true);

-- 1. The bypass this test exists for: a raw client insert may not choose an addressee.
select throws_ok(
  $$insert into public.traveler_requests
      (traveler_id, target_guide_id, destination, starts_on, ends_on, participants_count)
    values ('6d000000-0000-4000-8000-000000000001',
            '6d000000-0000-4000-8000-000000000002',
            'Hijacked Direct Insert', date '2026-09-01', date '2026-09-02', 2)$$,
  '42501',
  'new row violates row-level security policy for table "traveler_requests"',
  'traveler cannot directly insert a request addressed to a guide'
);

-- 2. Ordinary open requests are untouched.
select lives_ok(
  $$insert into public.traveler_requests
      (id, traveler_id, destination, starts_on, ends_on, participants_count,
       format_preference, open_to_join)
    values ('6f000000-0000-4000-8000-000000000001',
            '6d000000-0000-4000-8000-000000000001',
            'Ordinary Open Request', date '2026-09-01', date '2026-09-02', 2,
            'group', true)$$,
  'traveler can still directly insert an undirected open request'
);

-- 3. The listing CTA path: the addressee comes from the published listing.
select is(
  (select (public.create_directed_traveler_request(
      p_destination => 'Listing Directed Request',
      p_starts_on => date '2026-09-03',
      p_ends_on => date '2026-09-04',
      p_listing_id => '6e000000-0000-4000-8000-0000000000aa'
    )).target_guide_id),
  '6d000000-0000-4000-8000-000000000002'::uuid,
  'RPC derives the addressee from the published listing'
);

-- 4. An unpublished listing is not a derivation source.
select throws_ok(
  $$select public.create_directed_traveler_request(
      p_destination => 'Draft Listing Request',
      p_starts_on => date '2026-09-03',
      p_ends_on => date '2026-09-04',
      p_listing_id => '6e000000-0000-4000-8000-0000000000bb'
    )$$,
  'listing_unavailable',
  'RPC refuses to derive an addressee from an unpublished listing'
);

-- 5. The guide-slug CTA path resolves only approved guides.
select is(
  (select (public.create_directed_traveler_request(
      p_destination => 'Slug Directed Request',
      p_starts_on => date '2026-09-05',
      p_ends_on => date '2026-09-06',
      p_preferred_guide_slug => 'directed-guide'
    )).target_guide_id),
  '6d000000-0000-4000-8000-000000000002'::uuid,
  'RPC resolves an approved guide slug to the addressee'
);

-- 6. A slug that resolves to no approved guide fails closed — never a public fan-out.
select throws_ok(
  $$select public.create_directed_traveler_request(
      p_destination => 'Pending Guide Request',
      p_starts_on => date '2026-09-05',
      p_ends_on => date '2026-09-06',
      p_preferred_guide_slug => 'directed-pending-guide'
    )$$,
  'target_guide_unresolved',
  'RPC fails closed for a slug that is not an approved guide'
);

-- 7. Directed requests stay out of public discovery; the ordinary one stays in.
select results_eq(
  $$select destination from public.v_public_open_requests
     where destination in ('Ordinary Open Request', 'Listing Directed Request', 'Slug Directed Request')$$,
  $$values ('Ordinary Open Request'::text)$$,
  'only the undirected request reaches the public open-requests view'
);

-- 8. The next door: an owner may edit their own request, but not re-address it.
select throws_ok(
  $$update public.traveler_requests
       set target_guide_id = '6d000000-0000-4000-8000-000000000002'
     where id = '6f000000-0000-4000-8000-000000000001'$$,
  'target_guide_id_not_editable',
  'traveler cannot PATCH an addressee onto an existing open request'
);

-- 9. Ordinary edits of an own request keep working.
select lives_ok(
  $$update public.traveler_requests set notes = 'edited'
     where id = '6f000000-0000-4000-8000-000000000001'$$,
  'traveler can still edit other fields of their own request'
);

select * from finish();
rollback;
