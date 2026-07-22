-- Ready guide excursion → request → booking: the template identity survives the trip.
--
-- Two things are asserted here. The boundary: a browser cannot author the excursion its
-- request claims to be for — not on insert, not by PATCH afterwards — so the snapshot on a
-- request is always something the database read out of a published template. And the
-- lineage: a booking that carries only request_id can still name the excursion it is for,
-- which is the whole reason the snapshot exists.

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
    '7d000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'template-traveler@example.test',
    extensions.crypt('TemplateTraveler123!', extensions.gen_salt('bf')),
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
    '7d000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'template-guide@example.test',
    extensions.crypt('TemplateGuide123!', extensions.gen_salt('bf')),
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
    '7d000000-0000-4000-8000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'template-other-guide@example.test',
    extensions.crypt('TemplateOther123!', extensions.gen_salt('bf')),
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
  ('7d000000-0000-4000-8000-000000000001', 'traveler', 'template-traveler@example.test', 'Template Traveler', 'active'),
  ('7d000000-0000-4000-8000-000000000002', 'guide', 'template-guide@example.test', 'Template Guide', 'active'),
  ('7d000000-0000-4000-8000-000000000003', 'guide', 'template-other-guide@example.test', 'Other Guide', 'active')
on conflict (id) do update set
  role = excluded.role,
  account_status = excluded.account_status,
  updated_at = timezone('utc', now());

insert into public.guide_profiles (user_id, slug, verification_status)
values
  ('7d000000-0000-4000-8000-000000000002', 'template-guide', 'approved'),
  ('7d000000-0000-4000-8000-000000000003', 'template-other-guide', 'approved')
on conflict (user_id) do update set
  slug = excluded.slug,
  verification_status = excluded.verification_status,
  updated_at = timezone('utc', now());

insert into public.guide_templates (
  id, guide_id, title, description, duration_text, meeting_point,
  max_participants, region, price_scope, price_from_kopecks, status
)
values
  ('7e000000-0000-4000-8000-0000000000aa',
   '7d000000-0000-4000-8000-000000000002',
   'Адык: степь и Калмыкия', 'Прогулка по степи.', '5 часов', 'Элиста, площадь Ленина',
   8, 'Калмыкия', 'per_group', 450000, 'published'),
  ('7e000000-0000-4000-8000-0000000000bb',
   '7d000000-0000-4000-8000-000000000002',
   'Черновик', 'Ещё не опубликовано.', '2 часа', 'Элиста',
   4, 'Калмыкия', 'per_person', 100000, 'draft')
on conflict (id) do update set
  status = excluded.status,
  title = excluded.title;

-- Act as the traveler, exactly as the browser's own token would.
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '7d000000-0000-4000-8000-000000000001', true);

-- 1. The bypass this test exists for: a client-authored programme never lands on a request.
select throws_ok(
  $$insert into public.traveler_requests
      (traveler_id, destination, starts_on, ends_on, participants_count,
       guide_template_id, guide_template_snapshot)
    values ('7d000000-0000-4000-8000-000000000001',
            'Forged Programme', date '2026-09-01', date '2026-09-02', 2,
            '7e000000-0000-4000-8000-0000000000aa',
            '{"title":"Бесплатный вертолёт"}'::jsonb)$$,
  '42501',
  'new row violates row-level security policy for table "traveler_requests"',
  'traveler cannot directly insert a request carrying a template identity'
);

-- 2. The addressee comes from who owns the template, not from anything the browser sent.
select is(
  (select (public.create_directed_traveler_request(
      p_destination => 'Template Directed Request',
      p_starts_on => date '2026-09-03',
      p_ends_on => date '2026-09-04',
      p_guide_template_id => '7e000000-0000-4000-8000-0000000000aa'
    )).target_guide_id),
  '7d000000-0000-4000-8000-000000000002'::uuid,
  'RPC derives the addressee from the template''s owner'
);

-- 3. …and the snapshot is read out of the template itself.
select is(
  (select (public.create_directed_traveler_request(
      p_destination => 'Snapshot Request',
      p_starts_on => date '2026-09-03',
      p_ends_on => date '2026-09-04',
      p_guide_template_id => '7e000000-0000-4000-8000-0000000000aa',
      p_preferred_guide_slug => 'template-guide'
    )).guide_template_snapshot),
  jsonb_build_object(
    'id', '7e000000-0000-4000-8000-0000000000aa',
    'title', 'Адык: степь и Калмыкия',
    'description', 'Прогулка по степи.',
    'duration_text', '5 часов',
    'meeting_point', 'Элиста, площадь Ленина',
    'max_participants', 8,
    'region', 'Калмыкия',
    'price_scope', 'per_group',
    'price_from_kopecks', 450000
  ),
  'RPC snapshots the published template''s booking-truth fields'
);

-- 4. An unpublished template is not a source of anything.
select throws_ok(
  $$select public.create_directed_traveler_request(
      p_destination => 'Draft Template Request',
      p_starts_on => date '2026-09-05',
      p_ends_on => date '2026-09-06',
      p_guide_template_id => '7e000000-0000-4000-8000-0000000000bb'
    )$$,
  'template_unavailable',
  'RPC refuses an unpublished template'
);

-- 5. A template id that does not exist fails closed rather than degrading to open.
select throws_ok(
  $$select public.create_directed_traveler_request(
      p_destination => 'Ghost Template Request',
      p_starts_on => date '2026-09-05',
      p_ends_on => date '2026-09-06',
      p_guide_template_id => '7e000000-0000-4000-8000-0000000000cc'
    )$$,
  'template_unavailable',
  'RPC refuses a template that does not exist'
);

-- 6. Both halves of the CTA must name the same guide.
select throws_ok(
  $$select public.create_directed_traveler_request(
      p_destination => 'Mismatched Request',
      p_starts_on => date '2026-09-05',
      p_ends_on => date '2026-09-06',
      p_guide_template_id => '7e000000-0000-4000-8000-0000000000aa',
      p_preferred_guide_slug => 'template-other-guide'
    )$$,
  'template_guide_mismatch',
  'RPC refuses a template whose owner is not the named guide'
);

-- 7. A guide-only directed request is unchanged, and stays template-null.
select is(
  (select (public.create_directed_traveler_request(
      p_destination => 'Guide Only Request',
      p_starts_on => date '2026-09-07',
      p_ends_on => date '2026-09-08',
      p_preferred_guide_slug => 'template-guide'
    )).guide_template_id),
  null::uuid,
  'a guide-only directed request carries no template'
);

-- 8. The next door: the owner may edit their request, but not its excursion truth.
select throws_ok(
  $$update public.traveler_requests
       set guide_template_snapshot = '{"title":"Бесплатный вертолёт"}'::jsonb
     where destination = 'Template Directed Request'$$,
  'guide_template_snapshot_not_editable',
  'traveler cannot PATCH a programme onto their own request'
);

-- 9. …and the same door from the other side: clearing the link is an edit too. A guard that
--     only rejected a non-null new value let the owner PATCH the id to NULL and walk the
--     request away from the excursion it came from.
select throws_ok(
  $$update public.traveler_requests
       set guide_template_id = null
     where destination = 'Template Directed Request'$$,
  'guide_template_id_not_editable',
  'traveler cannot PATCH their request off its template'
);

-- 10. The blocked PATCH leaves the booked truth exactly where it was.
select is(
  (select guide_template_id::text || '|' || (guide_template_snapshot ->> 'title')
     from public.traveler_requests
    where destination = 'Template Directed Request'),
  '7e000000-0000-4000-8000-0000000000aa|Адык: степь и Калмыкия',
  'a refused PATCH changes neither the link nor the snapshot'
);

-- 11. A template the traveler cannot *see* is not a template that is gone. The guard reads
--     guide_templates past RLS on purpose; without that, unpublishing would reopen the hole.
reset role;
update public.guide_templates set status = 'draft'
 where id = '7e000000-0000-4000-8000-0000000000aa';
set local role authenticated;

select throws_ok(
  $$update public.traveler_requests
       set guide_template_id = null
     where destination = 'Template Directed Request'$$,
  'guide_template_id_not_editable',
  'an RLS-invisible template still counts as present'
);

reset role;
update public.guide_templates set status = 'published'
 where id = '7e000000-0000-4000-8000-0000000000aa';
set local role authenticated;

-- 12. The acceptance lineage: a booking carrying only request_id still names its excursion.
--    accept_offer inserts request-first bookings with listing_id NULL, so this join is the
--    only thing standing between the traveler and a booking page with no programme.
reset role;
insert into public.bookings (id, traveler_id, guide_id, request_id, status, party_size,
        subtotal_minor, currency, cancellation_policy_snapshot)
select '7f000000-0000-4000-8000-0000000000b1',
       '7d000000-0000-4000-8000-000000000001',
       '7d000000-0000-4000-8000-000000000002',
       r.id, 'confirmed', 2, 450000, 'RUB', '{}'::jsonb
  from public.traveler_requests r
 where r.destination = 'Template Directed Request';

select is(
  (select r.guide_template_snapshot ->> 'title'
     from public.bookings b
     join public.traveler_requests r on r.id = b.request_id
    where b.id = '7f000000-0000-4000-8000-0000000000b1'
      and b.listing_id is null),
  'Адык: степь и Калмыкия',
  'a listing-less booking still resolves its excursion programme through the request'
);

-- 13. Deleting the template unlinks it but leaves the booked truth behind — which is why
--     the pairing constraint is one-directional rather than a strict paired-null, and the
--     one null-ward change the freeze trigger still has to allow.
delete from public.guide_templates where id = '7e000000-0000-4000-8000-0000000000aa';

select ok(
  (select guide_template_id is null and guide_template_snapshot is not null
     from public.traveler_requests
    where destination = 'Template Directed Request'),
  'deleting the template nulls the link and keeps the snapshot'
);

select * from finish();
rollback;
