-- Destination media boundary: only admins write location media, the public may read
-- PUBLISHED rows only, and — the point of the delivery split — the only object any public
-- caller can sign is the revocable delivery copy, never the original asset.
begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(24);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values
  (
    '7b000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'media-admin@example.test',
    extensions.crypt('MediaAdmin123!', extensions.gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    timezone('utc', now()), timezone('utc', now()), false, '', '', '', ''
  ),
  (
    '7b000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'media-outsider@example.test',
    extensions.crypt('MediaOutsider123!', extensions.gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    timezone('utc', now()), timezone('utc', now()), false, '', '', '', ''
  )
on conflict (id) do update set email = excluded.email;

update public.profiles
   set role = 'admin'::public.app_role,
       account_status = 'active'::public.account_status
 where id = '7b000000-0000-4000-8000-000000000001';

update public.profiles
   set role = 'traveler'::public.app_role,
       account_status = 'active'::public.account_status
 where id = '7b000000-0000-4000-8000-000000000002';

insert into public.guide_location_catalog (id, name, status)
values ('7c000000-0000-4000-8000-000000000001', 'Тестоград', 'active')
on conflict (id) do nothing;

insert into public.location_media
  (id, location_id, object_path, delivery_object_path, role, status, is_primary,
   mime_type, byte_size)
values
  ('7d000000-0000-4000-8000-000000000001',
   '7c000000-0000-4000-8000-000000000001',
   'curator/published-cover.jpg', 'delivery/published-cover.jpg',
   'cover', 'published', true, 'image/jpeg', 100000),
  ('7d000000-0000-4000-8000-000000000002',
   '7c000000-0000-4000-8000-000000000001',
   'curator/draft-cover.jpg', NULL, 'cover', 'draft', false, 'image/jpeg', 100000),
  -- A published cover that is NOT primary, a row reserved before its upload, and a row a
  -- cancel has claimed: all three must be as unreadable as an outright draft.
  ('7d000000-0000-4000-8000-000000000003',
   '7c000000-0000-4000-8000-000000000001',
   'curator/published-secondary.jpg', NULL, 'cover', 'published', false, 'image/jpeg', 100000),
  ('7d000000-0000-4000-8000-000000000004',
   '7c000000-0000-4000-8000-000000000001',
   'curator/uploading.jpg', NULL, 'cover', 'uploading', false, 'image/jpeg', 100000),
  ('7d000000-0000-4000-8000-000000000005',
   '7c000000-0000-4000-8000-000000000001',
   'curator/cancelling.jpg', NULL, 'cover', 'cancelling', false, 'image/jpeg', 100000);

-- Storage objects backing those rows. The bucket is private, so `storage.objects` SELECT
-- is what decides whether a caller may mint a signed URL for a path.
select is(
  (select public from storage.buckets where id = 'location-media'),
  false,
  'the location-media bucket is private — a public bucket would bypass object RLS'
);

insert into storage.objects (bucket_id, name, metadata)
values
  ('location-media', 'curator/published-cover.jpg', '{}'::jsonb),
  ('location-media', 'delivery/published-cover.jpg', '{}'::jsonb),
  ('location-media', 'curator/draft-cover.jpg', '{}'::jsonb),
  ('location-media', 'curator/published-secondary.jpg', '{}'::jsonb),
  ('location-media', 'curator/uploading.jpg', '{}'::jsonb),
  ('location-media', 'curator/cancelling.jpg', '{}'::jsonb)
on conflict (bucket_id, name) do update set metadata = excluded.metadata;

-- Anonymous public reader ------------------------------------------------------
set local role anon;
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claim.sub', '', true);

select results_eq(
  $$ select object_path from public.location_media order by object_path $$,
  $$ values ('curator/published-cover.jpg'::text),
            ('curator/published-secondary.jpg'::text) $$,
  'anonymous readers see published location media only — no draft, uploading or cancelling path leaks'
);

-- The revocation guarantee, stated as a policy fact: the delivery copy is the ONLY object
-- a public caller can sign. Deleting that copy therefore ends public access outright,
-- which no signed-URL TTL or policy edit could do on its own.
select results_eq(
  $$
    select name from storage.objects
     where bucket_id = 'location-media'
     order by name
  $$,
  $$ values ('delivery/published-cover.jpg'::text) $$,
  'anonymous callers can read only the delivery copy of the published primary cover'
);

select is(
  (
    select count(*)::integer from storage.objects
     where bucket_id = 'location-media'
       and name = 'curator/published-cover.jpg'
  ),
  0,
  'the ORIGINAL behind a live published cover is unreadable — only the delivery copy is served'
);

select is(
  (
    select count(*)::integer from storage.objects
     where bucket_id = 'location-media'
       and name = 'curator/draft-cover.jpg'
  ),
  0,
  'a draft object cannot be read directly even when its path is known'
);

select is(
  (
    select count(*)::integer from storage.objects
     where bucket_id = 'location-media'
       and name = 'curator/uploading.jpg'
  ),
  0,
  'an object reserved by an uploading record cannot be read directly'
);

select is(
  (
    select count(*)::integer from storage.objects
     where bucket_id = 'location-media'
       and name = 'curator/cancelling.jpg'
  ),
  0,
  'an object whose row a cancel has claimed cannot be read directly'
);

select is(
  (
    select count(*)::integer from storage.objects
     where bucket_id = 'location-media'
       and name = 'curator/published-secondary.jpg'
  ),
  0,
  'a published but non-primary object cannot be read directly'
);

select throws_ok(
  $$
    insert into public.location_media (location_id, object_path, mime_type, byte_size)
    values ('7c000000-0000-4000-8000-000000000001', 'anon/hack.jpg', 'image/jpeg', 10)
  $$,
  '42501',
  NULL,
  'anonymous users cannot insert location media'
);

-- Signed-in non-admin ----------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '7b000000-0000-4000-8000-000000000002', true);

select is(
  (select count(*)::integer from public.location_media where status = 'draft'),
  0,
  'a signed-in non-admin cannot read draft location media'
);

select is(
  (
    select count(*)::integer from storage.objects
     where bucket_id = 'location-media'
       and name in ('curator/draft-cover.jpg', 'curator/uploading.jpg',
                    'curator/published-cover.jpg')
  ),
  0,
  'a signed-in non-admin cannot read draft, uploading or original cover objects directly'
);

select throws_ok(
  $$
    insert into public.location_media (location_id, object_path, mime_type, byte_size)
    values ('7c000000-0000-4000-8000-000000000001', 'traveler/hack.jpg', 'image/jpeg', 10)
  $$,
  '42501',
  NULL,
  'a signed-in non-admin cannot insert location media'
);

-- RLS makes this a silent no-op rather than an error; the assertion below (run as an
-- admin, who can actually see the row) proves the draft was never published.
update public.location_media
   set status = 'published'
 where id = '7d000000-0000-4000-8000-000000000002';

-- Admin ------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', '7b000000-0000-4000-8000-000000000001', true);

select is(
  (select status from public.location_media where id = '7d000000-0000-4000-8000-000000000002'),
  'draft',
  'a signed-in non-admin cannot publish location media'
);

select is(
  (select count(*)::integer from public.location_media),
  5,
  'an admin sees drafts, uploading and cancelling records alongside published media'
);

select is(
  (select count(*)::integer from storage.objects where bucket_id = 'location-media'),
  6,
  'an admin can read every object in the bucket, originals and drafts included'
);

-- The primary flag may only sit on a row the public resolver can actually serve.
select throws_ok(
  $$
    update public.location_media
       set is_primary = true
     where id = '7d000000-0000-4000-8000-000000000002'
  $$,
  '23514',
  NULL,
  'a draft cannot be made primary — a primary that resolves to nothing is not a cover'
);

select throws_ok(
  $$
    update public.location_media
       set is_primary = true, status = 'published'
     where id = '7d000000-0000-4000-8000-000000000002'
  $$,
  '23514',
  NULL,
  'publishing without a delivery copy is rejected — a primary must have something revocable'
);

-- Fail-closed swap: the demote-siblings trigger would otherwise strand the outgoing
-- primary's delivery copy, leaving the bucket serving a cover the console shows as demoted.
select throws_ok(
  $$
    update public.location_media
       set is_primary = true, status = 'published',
           delivery_object_path = 'delivery/new-cover.jpg'
     where id = '7d000000-0000-4000-8000-000000000002'
  $$,
  '23514',
  NULL,
  'promotion is refused while the outgoing primary still holds a live delivery copy'
);

-- What the application does before any demotion completes: delete the bytes, then drop
-- the claim on them in the same statement that clears the flag.
select lives_ok(
  $$
    update public.location_media
       set is_primary = false, delivery_object_path = NULL
     where id = '7d000000-0000-4000-8000-000000000001'
  $$,
  'revoking the delivery copy and demoting in one write is the supported transition'
);

select lives_ok(
  $$
    update public.location_media
       set is_primary = true, status = 'published',
           delivery_object_path = 'delivery/new-cover.jpg'
     where id = '7d000000-0000-4000-8000-000000000002'
  $$,
  'once the previous copy is revoked, the replacement can be promoted'
);

select is(
  (
    select count(*)::integer
      from public.location_media
     where location_id = '7c000000-0000-4000-8000-000000000001'
       and is_primary
  ),
  1,
  'promoting a new primary demotes the previous one — never two covers per location'
);

select throws_ok(
  $$
    update public.location_media
       set status = 'draft'
     where id = '7d000000-0000-4000-8000-000000000002'
  $$,
  '23514',
  NULL,
  'unpublishing a primary must clear the flag, not leave a primary nobody can read'
);

select throws_ok(
  $$
    update public.location_media
       set role = 'gallery'
     where id = '7d000000-0000-4000-8000-000000000002'
  $$,
  '23514',
  NULL,
  'demoting a primary to gallery must clear the flag too'
);

select throws_ok(
  $$
    update public.location_media
       set delivery_object_path = NULL
     where id = '7d000000-0000-4000-8000-000000000002'
  $$,
  '23514',
  NULL,
  'a primary cannot drop its delivery copy and stay primary — the two are one fact'
);

select * from finish();

rollback;
