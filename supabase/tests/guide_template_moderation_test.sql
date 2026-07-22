-- Issue #37: every newly created ready tour must enter pending_review, appear in the
-- admin moderation queue, and stay out of the public catalog until an admin publishes
-- it. Proves the moderation trigger, the insert default, RLS visibility, and the
-- same pending_review filter the /admin/moderation page uses.
begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(12);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  is_sso_user, confirmation_token, email_change, email_change_token_new, recovery_token)
values
  ('72000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','tmpl-guide@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),
   '{"provider":"email"}','{}', now(), now(), false,'','','',''),
  ('72000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','tmpl-admin@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),
   '{"provider":"email"}','{}', now(), now(), false,'','','','');

insert into public.profiles (id, role, email, full_name, account_status)
values
  ('72000000-0000-4000-8000-000000000001','guide','tmpl-guide@example.test','Guide','active'),
  ('72000000-0000-4000-8000-000000000002','admin','tmpl-admin@example.test','Admin','active')
on conflict (id) do update
  set role = excluded.role, account_status = excluded.account_status;

insert into public.guide_profiles (user_id, slug, verification_status)
values ('72000000-0000-4000-8000-000000000001','tmpl-guide','approved')
on conflict (user_id) do update set verification_status = excluded.verification_status;

-- Grandfathered published row, seeded by the trusted backend (no JWT) like production data.
insert into public.guide_templates (id, guide_id, title, price_from_kopecks, status)
values ('72000000-0000-4000-8000-0000000000ad',
        '72000000-0000-4000-8000-000000000001','Legacy published',500000,'published');

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated', true);
select set_config('request.jwt.claim.sub','72000000-0000-4000-8000-000000000001', true);

-- 1. Omitting status on insert lands in pending_review, not draft.
select lives_ok(
  $$insert into public.guide_templates (id, guide_id, title, price_from_kopecks)
    values ('72000000-0000-4000-8000-0000000000aa',
            '72000000-0000-4000-8000-000000000001','New tour',400000)$$,
  'guide insert without status is accepted');

select is(
  (select status from public.guide_templates where id='72000000-0000-4000-8000-0000000000aa'),
  'pending_review',
  'a new ready tour defaults to pending_review');

-- 2. Guide cannot self-publish on insert — status is coerced to pending_review.
select lives_ok(
  $$insert into public.guide_templates (id, guide_id, title, price_from_kopecks, status)
    values ('72000000-0000-4000-8000-0000000000ab',
            '72000000-0000-4000-8000-000000000001','Self publish',400000,'published')$$,
  'guide insert with published status is accepted but coerced');

select is(
  (select status from public.guide_templates where id='72000000-0000-4000-8000-0000000000ab'),
  'pending_review',
  'published status is coerced to pending_review on create');

-- 3. Guide CANNOT self-publish on update.
select throws_ok(
  $$update public.guide_templates set status='published'
      where id='72000000-0000-4000-8000-0000000000aa'$$,
  '23514',
  null,
  'guide cannot self-publish pending_review -> published');

-- 4. Anon cannot read a pending_review row (public catalog gate).
set local role anon;
select set_config('request.jwt.claim.role','anon', true);
select set_config('request.jwt.claim.sub','', true);

select is(
  (select count(*)::int from public.guide_templates
      where id='72000000-0000-4000-8000-0000000000aa'),
  0,
  'anon cannot see pending_review templates');

-- 5. Admin moderation queue includes the newly created pending tour.
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated', true);
select set_config('request.jwt.claim.sub','72000000-0000-4000-8000-000000000002', true);

select is(
  (select count(*)::int from public.guide_templates
    where status = 'pending_review'
      and id = '72000000-0000-4000-8000-0000000000aa'),
  1,
  'admin moderation queue includes the newly created pending tour');

-- 6. Admin approves pending_review -> published.
select lives_ok(
  $$update public.guide_templates set status='published'
      where id='72000000-0000-4000-8000-0000000000aa'$$,
  'admin can publish pending_review template');

-- 7. Published rows are visible to anon.
set local role anon;
select set_config('request.jwt.claim.role','anon', true);
select set_config('request.jwt.claim.sub','', true);

select is(
  (select count(*)::int from public.guide_templates
      where id='72000000-0000-4000-8000-0000000000aa' and status='published'),
  1,
  'anon can see published templates');

-- 8. Guide cannot persist a new tour as draft even with an explicit draft status.
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated', true);
select set_config('request.jwt.claim.sub','72000000-0000-4000-8000-000000000001', true);

select lives_ok(
  $$insert into public.guide_templates (id, guide_id, title, price_from_kopecks, status)
    values ('72000000-0000-4000-8000-0000000000ac',
            '72000000-0000-4000-8000-000000000001','Draft tour',300000,'draft')$$,
  'guide insert with explicit draft status is accepted but coerced');

select is(
  (select status from public.guide_templates where id='72000000-0000-4000-8000-0000000000ac'),
  'pending_review',
  'explicit draft status is coerced to pending_review on create');

-- 9. Existing published rows stay published (grandfathered).
select is(
  (select status from public.guide_templates where id='72000000-0000-4000-8000-0000000000ad'),
  'published',
  'seeded published templates remain published');

select * from finish();
rollback;
