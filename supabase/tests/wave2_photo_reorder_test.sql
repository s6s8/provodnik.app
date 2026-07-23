-- Wave 2 (#72): atomic photobank reorder authority.
begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(4);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  is_sso_user, confirmation_token, email_change, email_change_token_new, recovery_token)
values
  ('7e100000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','reorder-guide-a@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),
   '{"provider":"email"}','{}', now(), now(), false,'','','',''),
  ('7e100000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','reorder-guide-b@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),
   '{"provider":"email"}','{}', now(), now(), false,'','','','');

insert into public.profiles (id, role, email, full_name, account_status)
values
  ('7e100000-0000-4000-8000-000000000001','guide','reorder-guide-a@example.test','Guide A','active'),
  ('7e100000-0000-4000-8000-000000000002','guide','reorder-guide-b@example.test','Guide B','active')
on conflict (id) do update
  set role = excluded.role, account_status = excluded.account_status;

insert into public.guide_profiles (user_id, slug, verification_status)
values
  ('7e100000-0000-4000-8000-000000000001','reorder-guide-a','approved'),
  ('7e100000-0000-4000-8000-000000000002','reorder-guide-b','approved')
on conflict (user_id) do update set verification_status = excluded.verification_status;

insert into public.storage_assets (id, owner_id, bucket_id, object_path, asset_kind)
values
  ('7e100000-0000-4000-8000-0000000000b1','7e100000-0000-4000-8000-000000000001',
   'guide-portfolio','reorder-guide-a/0.jpg','guide-portfolio'),
  ('7e100000-0000-4000-8000-0000000000b2','7e100000-0000-4000-8000-000000000001',
   'guide-portfolio','reorder-guide-a/1.jpg','guide-portfolio'),
  ('7e100000-0000-4000-8000-0000000000b3','7e100000-0000-4000-8000-000000000001',
   'guide-portfolio','reorder-guide-a/2.jpg','guide-portfolio');

insert into public.guide_location_photos (id, guide_id, storage_asset_id, location_name, sort_order)
values
  ('7e100000-0000-4000-8000-0000000000c1','7e100000-0000-4000-8000-000000000001',
   '7e100000-0000-4000-8000-0000000000b1','Калининград',0),
  ('7e100000-0000-4000-8000-0000000000c2','7e100000-0000-4000-8000-000000000001',
   '7e100000-0000-4000-8000-0000000000b2','Калининград',1),
  ('7e100000-0000-4000-8000-0000000000c3','7e100000-0000-4000-8000-000000000001',
   '7e100000-0000-4000-8000-0000000000b3','Калининград',2);

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated', true);
select set_config('request.jwt.claim.sub','7e100000-0000-4000-8000-000000000001', true);

select lives_ok(
  $$
    select public.reorder_guide_location_photos(
      jsonb_build_array(
        jsonb_build_object('id','7e100000-0000-4000-8000-0000000000c1','sort_order',2),
        jsonb_build_object('id','7e100000-0000-4000-8000-0000000000c2','sort_order',1),
        jsonb_build_object('id','7e100000-0000-4000-8000-0000000000c3','sort_order',0)
      )
    )
  $$,
  'guide can reorder owned photobank rows in one call'
);

select is(
  (
    select array_agg(sort_order order by id)
    from public.guide_location_photos
    where guide_id = '7e100000-0000-4000-8000-000000000001'
  ),
  array[2,1,0],
  'all sort_order values are updated atomically'
);

select set_config('request.jwt.claim.sub','7e100000-0000-4000-8000-000000000002', true);

select throws_ok(
  $$
    select public.reorder_guide_location_photos(
      jsonb_build_array(
        jsonb_build_object('id','7e100000-0000-4000-8000-0000000000c1','sort_order',99)
      )
    )
  $$,
  '42501',
  'photo not found or not owned',
  'foreign guide cannot reorder another guide photobank rows'
);

select set_config('request.jwt.claim.sub','7e100000-0000-4000-8000-000000000001', true);

select throws_ok(
  $$
    select public.reorder_guide_location_photos(
      jsonb_build_array(
        jsonb_build_object('id','7e100000-0000-4000-8000-0000000000c1','sort_order',0),
        jsonb_build_object('id','00000000-0000-4000-8000-000000000099','sort_order',1)
      )
    )
  $$,
  '42501',
  'photo not found or not owned',
  'mixed owned/foreign ids abort the whole reorder'
);

select * from finish();
rollback;
