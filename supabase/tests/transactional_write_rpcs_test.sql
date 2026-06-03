begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(19);

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
    '51000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'transactional-traveler@example.test',
    extensions.crypt('TransactionalTraveler123!', extensions.gen_salt('bf')),
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
    '51000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'transactional-guide@example.test',
    extensions.crypt('TransactionalGuide123!', extensions.gen_salt('bf')),
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
    '51000000-0000-4000-8000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'transactional-outsider@example.test',
    extensions.crypt('TransactionalOutsider123!', extensions.gen_salt('bf')),
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
  encrypted_password = excluded.encrypted_password,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = excluded.updated_at;

insert into public.profiles (id, role, email, full_name)
values
  ('51000000-0000-4000-8000-000000000001', 'traveler', 'transactional-traveler@example.test', 'Transactional Traveler'),
  ('51000000-0000-4000-8000-000000000002', 'guide', 'transactional-guide@example.test', 'Transactional Guide'),
  ('51000000-0000-4000-8000-000000000003', 'traveler', 'transactional-outsider@example.test', 'Transactional Outsider')
on conflict (id) do update set
  role = excluded.role,
  email = excluded.email,
  full_name = excluded.full_name,
  updated_at = timezone('utc', now());

insert into public.listings (
  id,
  guide_id,
  slug,
  title,
  region,
  city,
  category,
  route_summary,
  description,
  duration_minutes,
  max_group_size,
  price_from_minor,
  currency,
  status
)
values (
  '52000000-0000-4000-8000-000000000001',
  '51000000-0000-4000-8000-000000000002',
  'transactional-rpc-listing',
  'Transactional RPC Listing',
  'Test Region',
  'Test City',
  'Test Category',
  'Start -> Finish',
  'Listing used by transactional RPC tests.',
  120,
  4,
  100000,
  'RUB',
  'published'
)
on conflict (id) do update set
  guide_id = excluded.guide_id,
  slug = excluded.slug,
  title = excluded.title,
  status = excluded.status,
  updated_at = timezone('utc', now());

insert into public.traveler_requests (
  id,
  traveler_id,
  destination,
  region,
  interests,
  starts_on,
  ends_on,
  budget_minor,
  currency,
  participants_count,
  format_preference,
  notes,
  open_to_join,
  allow_guide_suggestions,
  group_capacity,
  status
)
values (
  '53000000-0000-4000-8000-000000000001',
  '51000000-0000-4000-8000-000000000001',
  'Transactional RPC Destination',
  'Test Region',
  array['Culture'],
  date '2026-10-01',
  date '2026-10-02',
  100000,
  'RUB',
  2,
  'Private',
  'Request used by transactional RPC tests.',
  false,
  true,
  2,
  'open'
)
on conflict (id) do update set
  traveler_id = excluded.traveler_id,
  status = excluded.status,
  updated_at = timezone('utc', now());

insert into public.guide_offers (
  id,
  request_id,
  guide_id,
  listing_id,
  title,
  message,
  price_minor,
  currency,
  capacity,
  starts_at,
  ends_at,
  inclusions,
  expires_at,
  status
)
values (
  '53000000-0000-4000-8000-000000000002',
  '53000000-0000-4000-8000-000000000001',
  '51000000-0000-4000-8000-000000000002',
  '52000000-0000-4000-8000-000000000001',
  'Original transactional offer',
  'Original offer body.',
  100000,
  'RUB',
  2,
  '2026-10-01 09:00+00',
  '2026-10-01 12:00+00',
  array['Guide'],
  timezone('utc', now()) + interval '7 days',
  'pending'
)
on conflict (id) do update set
  request_id = excluded.request_id,
  guide_id = excluded.guide_id,
  price_minor = excluded.price_minor,
  status = excluded.status,
  updated_at = timezone('utc', now());

insert into public.bookings (
  id,
  traveler_id,
  guide_id,
  listing_id,
  status,
  party_size,
  starts_at,
  ends_at,
  subtotal_minor,
  deposit_minor,
  remainder_minor,
  currency,
  cancellation_policy_snapshot,
  meeting_point
)
values
  (
    '54000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000002',
    '52000000-0000-4000-8000-000000000001',
    'confirmed',
    2,
    '2026-10-03 09:00+00',
    '2026-10-03 12:00+00',
    100000,
    30000,
    70000,
    'RUB',
    '{}'::jsonb,
    'Dispute meeting point'
  ),
  (
    '54000000-0000-4000-8000-000000000002',
    '51000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000002',
    '52000000-0000-4000-8000-000000000001',
    'completed',
    2,
    '2026-10-04 09:00+00',
    '2026-10-04 12:00+00',
    100000,
    30000,
    70000,
    'RUB',
    '{}'::jsonb,
    'Review meeting point'
  )
on conflict (id) do update set
  traveler_id = excluded.traveler_id,
  guide_id = excluded.guide_id,
  listing_id = excluded.listing_id,
  status = excluded.status,
  updated_at = timezone('utc', now());

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);

select set_config('request.jwt.claim.sub', '51000000-0000-4000-8000-000000000003', true);

select throws_ok(
  $$
    select public.counter_offer(
      '53000000-0000-4000-8000-000000000002'::uuid,
      120000,
      'Unauthorized counter'
    )
  $$,
  'P0001',
  'unauthorized',
  'counter_offer denies a caller who does not own the traveler request'
);

select is(
  (
    select status::text
    from public.guide_offers
    where id = '53000000-0000-4000-8000-000000000002'
  ),
  'pending',
  'failed counter_offer leaves the original offer pending'
);

select is(
  (
    select count(*)::integer
    from public.guide_offers
    where request_id = '53000000-0000-4000-8000-000000000001'
      and message = 'Unauthorized counter'
  ),
  0,
  'failed counter_offer does not insert a replacement offer'
);

select set_config('request.jwt.claim.sub', '51000000-0000-4000-8000-000000000001', true);

select lives_ok(
  $$
    select public.counter_offer(
      '53000000-0000-4000-8000-000000000002'::uuid,
      120000,
      'Authorized counter'
    )
  $$,
  'counter_offer allows the request owner to counter a pending offer'
);

select is(
  (
    select status::text
    from public.guide_offers
    where id = '53000000-0000-4000-8000-000000000002'
  ),
  'counter_offered',
  'counter_offer marks the original offer as counter_offered'
);

select is(
  (
    select count(*)::integer
    from public.guide_offers
    where request_id = '53000000-0000-4000-8000-000000000001'
      and guide_id = '51000000-0000-4000-8000-000000000002'
      and price_minor = 120000
      and message = 'Authorized counter'
      and status = 'pending'
  ),
  1,
  'counter_offer inserts one pending replacement offer'
);

select set_config('request.jwt.claim.sub', '51000000-0000-4000-8000-000000000003', true);

select throws_ok(
  $$
    select public.open_dispute(
      '54000000-0000-4000-8000-000000000001'::uuid,
      'Outsider dispute'
    )
  $$,
  'P0001',
  'unauthorized',
  'open_dispute denies a non-party booking caller'
);

select is(
  (
    select count(*)::integer
    from public.disputes
    where booking_id = '54000000-0000-4000-8000-000000000001'
  ),
  0,
  'failed open_dispute does not insert a dispute'
);

select is(
  (
    select status::text
    from public.bookings
    where id = '54000000-0000-4000-8000-000000000001'
  ),
  'confirmed',
  'failed open_dispute leaves the booking status unchanged'
);

select set_config('request.jwt.claim.sub', '51000000-0000-4000-8000-000000000001', true);

select lives_ok(
  $$
    select public.open_dispute(
      '54000000-0000-4000-8000-000000000001'::uuid,
      'Authorized dispute'
    )
  $$,
  'open_dispute allows a booking party to open a dispute'
);

select is(
  (
    select status::text
    from public.bookings
    where id = '54000000-0000-4000-8000-000000000001'
  ),
  'disputed',
  'open_dispute marks the booking disputed'
);

select is(
  (
    select count(*)::integer
    from public.disputes d
    join public.dispute_events de on de.dispute_id = d.id
    where d.booking_id = '54000000-0000-4000-8000-000000000001'
      and d.opened_by = '51000000-0000-4000-8000-000000000001'
      and d.reason = 'Authorized dispute'
      and de.actor_id = '51000000-0000-4000-8000-000000000001'
      and de.event_type = 'opened'
  ),
  1,
  'open_dispute inserts the dispute row and opening event'
);

select set_config('request.jwt.claim.sub', '51000000-0000-4000-8000-000000000003', true);

select throws_ok(
  $$
    select public.submit_review(
      '54000000-0000-4000-8000-000000000002'::uuid,
      '51000000-0000-4000-8000-000000000002'::uuid,
      '52000000-0000-4000-8000-000000000001'::uuid,
      5,
      'Outsider review',
      5,
      5,
      5,
      5
    )
  $$,
  'P0001',
  'unauthorized',
  'submit_review denies callers who do not own the completed booking'
);

select set_config('request.jwt.claim.sub', '51000000-0000-4000-8000-000000000001', true);

select throws_ok(
  $$
    select public.submit_review(
      '54000000-0000-4000-8000-000000000002'::uuid,
      '51000000-0000-4000-8000-000000000002'::uuid,
      '52000000-0000-4000-8000-000000000001'::uuid,
      5,
      'Invalid review',
      6,
      5,
      5,
      5
    )
  $$,
  'P0001',
  'invalid_review_score',
  'submit_review validates axis scores inside the RPC'
);

select is(
  (
    select count(*)::integer
    from public.reviews
    where booking_id = '54000000-0000-4000-8000-000000000002'
  ),
  0,
  'failed submit_review does not insert a review'
);

select lives_ok(
  $$
    select public.submit_review(
      '54000000-0000-4000-8000-000000000002'::uuid,
      '51000000-0000-4000-8000-000000000002'::uuid,
      '52000000-0000-4000-8000-000000000001'::uuid,
      5,
      'Authorized review',
      5,
      4,
      3,
      2
    )
  $$,
  'submit_review allows the traveler to review a completed booking'
);

select is(
  (
    select count(*)::integer
    from public.reviews
    where booking_id = '54000000-0000-4000-8000-000000000002'
      and traveler_id = '51000000-0000-4000-8000-000000000001'
      and guide_id = '51000000-0000-4000-8000-000000000002'
      and listing_id = '52000000-0000-4000-8000-000000000001'
      and rating = 5
      and body = 'Authorized review'
  ),
  1,
  'submit_review inserts the review row'
);

select is(
  (
    select count(*)::integer
    from public.review_ratings_breakdown rb
    join public.reviews r on r.id = rb.review_id
    where r.booking_id = '54000000-0000-4000-8000-000000000002'
      and (rb.axis, rb.score) in (
        ('material', 5::smallint),
        ('engagement', 4::smallint),
        ('knowledge', 3::smallint),
        ('route', 2::smallint)
      )
  ),
  4,
  'submit_review inserts the four axis breakdown rows'
);

select throws_ok(
  $$
    select public.submit_review(
      '54000000-0000-4000-8000-000000000002'::uuid,
      '51000000-0000-4000-8000-000000000002'::uuid,
      '52000000-0000-4000-8000-000000000001'::uuid,
      5,
      'Duplicate review',
      5,
      5,
      5,
      5
    )
  $$,
  'P0001',
  'review_already_exists',
  'submit_review rejects duplicate reviews for a booking'
);

select * from finish();

rollback;
