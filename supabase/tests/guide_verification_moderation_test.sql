-- Owner 609 P0: a guide must not be able to self-approve verification.
-- Proves fn_enforce_guide_verification freezes the moderation trio for guides while
-- keeping their submit-for-review transition and ordinary profile edits working.
begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(7);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  is_sso_user, confirmation_token, email_change, email_change_token_new, recovery_token)
values
  ('62000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','ver-guide@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),'{"provider":"email"}','{}',
   now(), now(), false,'','','',''),
  ('62000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','ver-admin@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),'{"provider":"email"}','{}',
   now(), now(), false,'','','','');

insert into public.profiles (id, role, email, full_name, account_status)
values
  ('62000000-0000-4000-8000-000000000001','guide','ver-guide@example.test','G','active'),
  ('62000000-0000-4000-8000-000000000002','admin','ver-admin@example.test','A','active')
on conflict (id) do update set role=excluded.role, account_status=excluded.account_status;

insert into public.guide_profiles (user_id, slug, verification_status, bio)
values ('62000000-0000-4000-8000-000000000001','ver-guide','draft','old bio')
on conflict (user_id) do update set verification_status=excluded.verification_status;

-- Act as the guide.
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated', true);
select set_config('request.jwt.claim.sub','62000000-0000-4000-8000-000000000001', true);

-- 1. Guide submits for review: draft -> submitted is allowed.
select lives_ok(
  $$update public.guide_profiles set verification_status='submitted'
      where user_id='62000000-0000-4000-8000-000000000001'$$,
  'guide can submit draft -> submitted');

-- 2. Guide CANNOT self-approve: submitted -> approved is blocked.
select throws_ok(
  $$update public.guide_profiles set verification_status='approved'
      where user_id='62000000-0000-4000-8000-000000000001'$$,
  '23514', null,
  'guide cannot self-approve verification');

-- 3. Guide cannot write moderator notes.
select throws_ok(
  $$update public.guide_profiles set verification_notes='ok by me'
      where user_id='62000000-0000-4000-8000-000000000001'$$,
  '23514', null,
  'guide cannot set verification_notes');

-- 4. Guide cannot change attestation_status.
select throws_ok(
  $$update public.guide_profiles set attestation_status='attested'
      where user_id='62000000-0000-4000-8000-000000000001'$$,
  '23514', null,
  'guide cannot set attestation_status');

-- 5. Guide CAN still edit an ordinary owned field.
select lives_ok(
  $$update public.guide_profiles set bio='new bio'
      where user_id='62000000-0000-4000-8000-000000000001'$$,
  'guide can still edit their bio');

-- Act as the admin.
select set_config('request.jwt.claim.sub','62000000-0000-4000-8000-000000000002', true);

-- 6. Admin approves: submitted -> approved works.
select lives_ok(
  $$update public.guide_profiles set verification_status='approved'
      where user_id='62000000-0000-4000-8000-000000000001'$$,
  'admin can approve verification');

-- 7. It stuck.
select is(
  (select verification_status::text from public.guide_profiles
     where user_id='62000000-0000-4000-8000-000000000001'),
  'approved',
  'verification is approved after admin decision');

select finish();
rollback;
