begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(8);

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
    '7a000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'rpc-photo-traveler@example.test',
    extensions.crypt('Traveler123!', extensions.gen_salt('bf')),
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
    '7a000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'rpc-photo-guide@example.test',
    extensions.crypt('Guide123!', extensions.gen_salt('bf')),
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
    '7a000000-0000-4000-8000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'rpc-photo-draft-guide@example.test',
    extensions.crypt('DraftGuide123!', extensions.gen_salt('bf')),
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
  ('7a000000-0000-4000-8000-000000000001', 'traveler', 'rpc-photo-traveler@example.test', 'RPC Photo Traveler'),
  ('7a000000-0000-4000-8000-000000000002', 'guide', 'rpc-photo-guide@example.test', 'RPC Photo Guide'),
  ('7a000000-0000-4000-8000-000000000003', 'guide', 'rpc-photo-draft-guide@example.test', 'RPC Photo Draft Guide')
on conflict (id) do update set
  role = excluded.role,
  email = excluded.email,
  full_name = excluded.full_name,
  updated_at = timezone('utc', now());

insert into public.guide_profiles (user_id, slug, verification_status, is_available)
values
  ('7a000000-0000-4000-8000-000000000002', 'rpc-photo-guide', 'approved', true),
  ('7a000000-0000-4000-8000-000000000003', 'rpc-photo-draft-guide', 'draft', true)
on conflict (user_id) do update set
  slug = excluded.slug,
  verification_status = excluded.verification_status,
  is_available = excluded.is_available,
  updated_at = timezone('utc', now());

insert into public.traveler_requests (
  id,
  traveler_id,
  destination,
  region,
  category,
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
  '7b000000-0000-4000-8000-000000000001',
  '7a000000-0000-4000-8000-000000000001',
  'RPC Photo Request',
  'Test Region',
  'city',
  date '2026-10-01',
  date '2026-10-02',
  100000,
  'RUB',
  2,
  'private',
  'RPC authorization regression test.',
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
    '7c000000-0000-4000-8000-000000000001',
    '7b000000-0000-4000-8000-000000000001',
    '7a000000-0000-4000-8000-000000000002',
    'Pending offer one',
    'Counted pending offer.',
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
    '7c000000-0000-4000-8000-000000000002',
    '7b000000-0000-4000-8000-000000000001',
    '7a000000-0000-4000-8000-000000000003',
    'Pending offer two',
    'Counted pending offer.',
    100000,
    'RUB',
    2,
    '2026-10-01 13:00+00',
    '2026-10-01 16:00+00',
    array['Guide'],
    timezone('utc', now()) + interval '7 days',
    'pending'
  )
on conflict (id) do update set
  status = excluded.status,
  updated_at = timezone('utc', now());

insert into public.storage_assets (id, owner_id, bucket_id, object_path, asset_kind, mime_type, byte_size)
values
  (
    '7d000000-0000-4000-8000-000000000001',
    '7a000000-0000-4000-8000-000000000002',
    'guide-portfolio',
    'approved/photo.jpg',
    'guide-portfolio',
    'image/jpeg',
    1024
  ),
  (
    '7d000000-0000-4000-8000-000000000002',
    '7a000000-0000-4000-8000-000000000003',
    'guide-portfolio',
    'draft/photo.jpg',
    'guide-portfolio',
    'image/jpeg',
    1024
  )
on conflict (bucket_id, object_path) do update set
  owner_id = excluded.owner_id,
  asset_kind = excluded.asset_kind,
  mime_type = excluded.mime_type,
  byte_size = excluded.byte_size;

insert into public.guide_location_photos (
  id,
  guide_id,
  storage_asset_id,
  location_name,
  sort_order
)
values
  (
    '7e000000-0000-4000-8000-000000000001',
    '7a000000-0000-4000-8000-000000000002',
    '7d000000-0000-4000-8000-000000000001',
    'Approved Public Photo',
    1
  ),
  (
    '7e000000-0000-4000-8000-000000000002',
    '7a000000-0000-4000-8000-000000000003',
    '7d000000-0000-4000-8000-000000000002',
    'Draft Hidden Photo',
    1
  )
on conflict (id) do update set
  guide_id = excluded.guide_id,
  storage_asset_id = excluded.storage_asset_id,
  location_name = excluded.location_name,
  sort_order = excluded.sort_order;

set local role anon;
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claim.sub', '', true);

select throws_ok(
  $$ select public.count_competing_offers('7b000000-0000-4000-8000-000000000001'::uuid) $$,
  '42501',
  'permission denied for function count_competing_offers',
  'anon cannot execute count_competing_offers'
);

select throws_ok(
  $$ select public.record_request_view('7b000000-0000-4000-8000-000000000001'::uuid) $$,
  '42501',
  'permission denied for function record_request_view',
  'anon cannot execute record_request_view'
);

select results_eq(
  $$
    select location_name
    from public.guide_location_photos
    order by location_name
  $$,
  $$ values ('Approved Public Photo'::text) $$,
  'public guide location photos only expose approved guides'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '7a000000-0000-4000-8000-000000000001', true);

select throws_ok(
  $$ select public.count_competing_offers('7b000000-0000-4000-8000-000000000001'::uuid) $$,
  'P0001',
  'guide_required',
  'authenticated travelers cannot execute count_competing_offers'
);

select throws_ok(
  $$ select public.record_request_view('7b000000-0000-4000-8000-000000000001'::uuid) $$,
  'P0001',
  'guide_required',
  'authenticated travelers cannot execute record_request_view'
);

select set_config('request.jwt.claim.sub', '7a000000-0000-4000-8000-000000000002', true);

select is(
  public.count_competing_offers('7b000000-0000-4000-8000-000000000001'::uuid),
  2,
  'authenticated guides can execute count_competing_offers'
);

select is(
  public.record_request_view('7b000000-0000-4000-8000-000000000001'::uuid),
  1,
  'authenticated guides can record request views'
);

update public.request_views
set viewed_at = '2026-01-01 00:00:00+00'::timestamptz
where request_id = '7b000000-0000-4000-8000-000000000001'::uuid
  and guide_id = '7a000000-0000-4000-8000-000000000002'::uuid;

do $do$
begin
  perform public.record_request_view('7b000000-0000-4000-8000-000000000001'::uuid);
end;
$do$;

create temporary table request_view_rate_limit_snapshot as
select viewed_at
from public.request_views
where request_id = '7b000000-0000-4000-8000-000000000001'::uuid
  and guide_id = '7a000000-0000-4000-8000-000000000002'::uuid;

do $do$
begin
  perform public.record_request_view('7b000000-0000-4000-8000-000000000001'::uuid);
end;
$do$;

select is(
  (
    select viewed_at
    from public.request_views
    where request_id = '7b000000-0000-4000-8000-000000000001'::uuid
      and guide_id = '7a000000-0000-4000-8000-000000000002'::uuid
  ),
  (select viewed_at from request_view_rate_limit_snapshot),
  'record_request_view does not rewrite a fresh view timestamp'
);

select * from finish();

rollback;
