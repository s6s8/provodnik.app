begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(4);

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
    '6a000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'storage-owner@example.test',
    extensions.crypt('StorageOwner123!', extensions.gen_salt('bf')),
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
    '6a000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'storage-outsider@example.test',
    extensions.crypt('StorageOutsider123!', extensions.gen_salt('bf')),
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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('guide-portfolio', 'guide-portfolio', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('guide-documents', 'guide-documents', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

delete from storage.objects
where bucket_id in ('guide-portfolio', 'guide-documents')
  and name in (
    '6a000000-0000-4000-8000-000000000001/portfolio.jpg',
    '6a000000-0000-4000-8000-000000000001/document.pdf'
  );

insert into storage.objects (bucket_id, name, owner, metadata)
values
  (
    'guide-portfolio',
    '6a000000-0000-4000-8000-000000000001/portfolio.jpg',
    '6a000000-0000-4000-8000-000000000001',
    '{}'::jsonb
  ),
  (
    'guide-documents',
    '6a000000-0000-4000-8000-000000000001/document.pdf',
    '6a000000-0000-4000-8000-000000000001',
    '{}'::jsonb
  );

set local role anon;
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claim.sub', '', true);

select results_eq(
  $$
    select name
    from storage.objects
    where bucket_id = 'guide-portfolio'
      and name = '6a000000-0000-4000-8000-000000000001/portfolio.jpg'
  $$,
  $$ values ('6a000000-0000-4000-8000-000000000001/portfolio.jpg'::text) $$,
  'anonymous readers can select public guide portfolio objects'
);

select is(
  (
    select count(*)::integer
    from storage.objects
    where bucket_id = 'guide-documents'
      and name = '6a000000-0000-4000-8000-000000000001/document.pdf'
  ),
  0,
  'anonymous readers cannot select private guide documents'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '6a000000-0000-4000-8000-000000000002', true);

select is(
  (
    with attempted_delete as (
      delete from storage.objects
      where bucket_id = 'guide-documents'
        and name = '6a000000-0000-4000-8000-000000000001/document.pdf'
      returning name
    )
    select count(*)::integer from attempted_delete
  ),
  0,
  'authenticated outsiders cannot delete another guide document object'
);

select set_config('request.jwt.claim.sub', '6a000000-0000-4000-8000-000000000001', true);

select is(
  (
    with attempted_delete as (
      delete from storage.objects
      where bucket_id = 'guide-documents'
        and name = '6a000000-0000-4000-8000-000000000001/document.pdf'
      returning name
    )
    select count(*)::integer from attempted_delete
  ),
  1,
  'authenticated owners can delete their own guide document object'
);

select * from finish();

rollback;
