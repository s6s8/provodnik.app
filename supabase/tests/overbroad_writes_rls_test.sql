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
    '51000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'rls-traveler@example.test',
    extensions.crypt('RlsTraveler123!', extensions.gen_salt('bf')),
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
    'rls-guide@example.test',
    extensions.crypt('RlsGuide123!', extensions.gen_salt('bf')),
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
    'rls-outsider@example.test',
    extensions.crypt('RlsOutsider123!', extensions.gen_salt('bf')),
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
    '51000000-0000-4000-8000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'rls-admin@example.test',
    extensions.crypt('RlsAdmin123!', extensions.gen_salt('bf')),
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
  ('51000000-0000-4000-8000-000000000001', 'traveler', 'rls-traveler@example.test', 'RLS Traveler'),
  ('51000000-0000-4000-8000-000000000002', 'guide', 'rls-guide@example.test', 'RLS Guide'),
  ('51000000-0000-4000-8000-000000000003', 'traveler', 'rls-outsider@example.test', 'RLS Outsider'),
  ('51000000-0000-4000-8000-000000000004', 'admin', 'rls-admin@example.test', 'RLS Admin')
on conflict (id) do update set
  role = excluded.role,
  email = excluded.email,
  full_name = excluded.full_name,
  updated_at = timezone('utc', now());

insert into public.guide_profiles (user_id, slug, verification_status)
values ('51000000-0000-4000-8000-000000000002', 'rls-guide', 'approved')
on conflict (user_id) do update set
  verification_status = excluded.verification_status,
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
  '52000000-0000-4000-8000-000000000001',
  '51000000-0000-4000-8000-000000000001',
  'RLS Test',
  'Test Region',
  array['history_culture'],
  date '2026-10-01',
  date '2026-10-02',
  100000,
  'RUB',
  2,
  'Private',
  'Over-broad write policy test.',
  false,
  true,
  2,
  'open'
)
on conflict (id) do update set
  status = excluded.status,
  updated_at = timezone('utc', now());

insert into public.guide_offers (
  id,
  request_id,
  guide_id,
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
values
  (
    '53000000-0000-4000-8000-000000000001',
    '52000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000002',
    'Original offer',
    'Traveler may decline this offer only.',
    100000,
    'RUB',
    2,
    '2026-10-01 09:00+00',
    '2026-10-01 12:00+00',
    array['Guide'],
    timezone('utc', now()) + interval '7 days',
    'pending'
  ),
  (
    '53000000-0000-4000-8000-000000000002',
    '52000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000002',
    'Declinable offer',
    'Traveler may decline this offer.',
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
  price_minor = excluded.price_minor,
  status = excluded.status,
  updated_at = timezone('utc', now());

insert into public.referral_codes (id, user_id, code)
values ('54000000-0000-4000-8000-000000000001', '51000000-0000-4000-8000-000000000002', 'RLSGUIDE')
on conflict (id) do update set
  user_id = excluded.user_id,
  code = excluded.code;

insert into public.referral_redemptions (code_id, redeemed_by)
values ('54000000-0000-4000-8000-000000000001', '51000000-0000-4000-8000-000000000001')
on conflict (code_id, redeemed_by) do nothing;

insert into public.bookings (
  id,
  traveler_id,
  guide_id,
  request_id,
  offer_id,
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
    '55000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000002',
    '52000000-0000-4000-8000-000000000001',
    '53000000-0000-4000-8000-000000000001',
    'completed',
    2,
    '2026-10-01 09:00+00',
    '2026-10-01 12:00+00',
    100000,
    30000,
    70000,
    'RUB',
    '{}'::jsonb,
    'Test meeting point'
  ),
  (
    '55000000-0000-4000-8000-000000000002',
    '51000000-0000-4000-8000-000000000003',
    '51000000-0000-4000-8000-000000000002',
    null,
    null,
    'completed',
    1,
    '2026-10-03 09:00+00',
    '2026-10-03 12:00+00',
    100000,
    30000,
    70000,
    'RUB',
    '{}'::jsonb,
    'Other meeting point'
  )
on conflict (id) do update set
  status = excluded.status,
  updated_at = timezone('utc', now());

insert into public.reviews (
  id,
  booking_id,
  traveler_id,
  guide_id,
  rating,
  title,
  body,
  status
)
values
  (
    '56000000-0000-4000-8000-000000000001',
    '55000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000002',
    5,
    'Owned published review',
    'The owning traveler may add ratings breakdown rows.',
    'published'
  ),
  (
    '56000000-0000-4000-8000-000000000002',
    '55000000-0000-4000-8000-000000000002',
    '51000000-0000-4000-8000-000000000003',
    '51000000-0000-4000-8000-000000000002',
    5,
    'Outsider review',
    'Another traveler owns this review.',
    'published'
  )
on conflict (id) do update set
  status = excluded.status,
  updated_at = timezone('utc', now());

insert into public.guide_licenses (
  id,
  guide_id,
  license_type,
  license_number,
  issued_by,
  valid_until
)
values (
  '57000000-0000-4000-8000-000000000001',
  '51000000-0000-4000-8000-000000000002',
  'tour_operator',
  'OLD-123',
  'RLS Registry',
  date '2027-01-01'
)
on conflict (id) do update set
  guide_id = excluded.guide_id,
  license_number = excluded.license_number,
  updated_at = timezone('utc', now());

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);

select set_config('request.jwt.claim.sub', '51000000-0000-4000-8000-000000000001', true);

select throws_ok(
  $$
    insert into public.marketplace_events (
      scope,
      request_id,
      actor_id,
      event_type,
      summary
    )
    values (
      'request',
      '52000000-0000-4000-8000-000000000001',
      '51000000-0000-4000-8000-000000000003',
      'spoofed_direct_insert',
      'Authenticated users must not insert directly.'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "marketplace_events"',
  'authenticated users cannot insert marketplace_events directly'
);

select lives_ok(
  $$
    select public.record_marketplace_event(
      'request'::public.event_scope,
      '52000000-0000-4000-8000-000000000001'::uuid,
      null::uuid,
      null::uuid,
      'request_note',
      'Traveler action recorded',
      null::text,
      '{"source":"pgtap"}'::jsonb
    )
  $$,
  'authenticated users can record marketplace events through the scoped RPC'
);

set local role postgres;

select is(
  (
    select actor_id
    from public.marketplace_events
    where event_type = 'request_note'
      and summary = 'Traveler action recorded'
    order by created_at desc
    limit 1
  ),
  '51000000-0000-4000-8000-000000000001'::uuid,
  'marketplace event RPC derives actor_id from auth.uid()'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '51000000-0000-4000-8000-000000000001', true);

select throws_ok(
  $$
    update public.guide_offers
       set price_minor = 1
     where id = '53000000-0000-4000-8000-000000000001'
  $$,
  'P0001',
  'traveler_offer_update_forbidden',
  'request owners cannot update offer business columns'
);

select lives_ok(
  $$
    update public.guide_offers
       set status = 'declined'
     where id = '53000000-0000-4000-8000-000000000002'
  $$,
  'request owners can decline their own request offers'
);

select set_config('request.jwt.claim.sub', '51000000-0000-4000-8000-000000000001', true);

select throws_ok(
  $$
    insert into public.bonus_ledger (user_id, delta, reason, ref_id)
    values (
      '51000000-0000-4000-8000-000000000002',
      100,
      'referral_used',
      '54000000-0000-4000-8000-000000000001'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "bonus_ledger"',
  'redeemers cannot insert referral_used credits for the code owner'
);

select set_config('request.jwt.claim.sub', '51000000-0000-4000-8000-000000000002', true);

select lives_ok(
  $$
    insert into public.bonus_ledger (user_id, delta, reason, ref_id)
    values (
      '51000000-0000-4000-8000-000000000002',
      100,
      'referral_used',
      '54000000-0000-4000-8000-000000000001'
    )
  $$,
  'the referral code owner can insert their own referral_used credit'
);

select set_config('request.jwt.claim.sub', '51000000-0000-4000-8000-000000000003', true);

select throws_ok(
  $$
    insert into public.review_ratings_breakdown (review_id, axis, score)
    values ('56000000-0000-4000-8000-000000000001', 'material', 5)
  $$,
  '42501',
  'new row violates row-level security policy for table "review_ratings_breakdown"',
  'travelers cannot insert ratings breakdown rows for another traveler review'
);

select set_config('request.jwt.claim.sub', '51000000-0000-4000-8000-000000000001', true);

select lives_ok(
  $$
    insert into public.review_ratings_breakdown (review_id, axis, score)
    values ('56000000-0000-4000-8000-000000000001', 'material', 5)
  $$,
  'the traveler who owns a published review can insert its ratings breakdown'
);

select set_config('request.jwt.claim.sub', '51000000-0000-4000-8000-000000000003', true);

select lives_ok(
  $$
    update public.guide_licenses
       set license_number = 'OUTSIDER-999'
     where id = '57000000-0000-4000-8000-000000000001'
  $$,
  'an outsider update attempt against guide license metadata is denied by row visibility'
);

select set_config('request.jwt.claim.sub', '51000000-0000-4000-8000-000000000002', true);

select is(
  (
    select license_number
    from public.guide_licenses
    where id = '57000000-0000-4000-8000-000000000001'
  ),
  'OLD-123',
  'outsider guide license update attempt leaves stored metadata unchanged'
);

select set_config('request.jwt.claim.sub', '51000000-0000-4000-8000-000000000002', true);

select lives_ok(
  $$
    update public.guide_licenses
       set license_number = 'OWNER-456'
     where id = '57000000-0000-4000-8000-000000000001'
  $$,
  'guide license owners can update their own license metadata'
);

select set_config('request.jwt.claim.sub', '51000000-0000-4000-8000-000000000004', true);

select lives_ok(
  $$
    insert into public.marketplace_events (
      scope,
      request_id,
      actor_id,
      event_type,
      summary
    )
    values (
      'request',
      '52000000-0000-4000-8000-000000000001',
      '51000000-0000-4000-8000-000000000004',
      'admin_direct_insert',
      'Admin direct insert remains available.'
    )
  $$,
  'admins can still insert marketplace_events directly'
);

select * from finish();

rollback;
