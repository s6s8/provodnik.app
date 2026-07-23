-- Task #94: guides may author per-group or per-person ready tours at the data boundary.
-- Proves both scopes persist on authenticated create/update while legacy per_person rows
-- and the per_group default for omitted scope stay intact.
begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(8);

-- Actor: one approved guide who owns every template below.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  is_sso_user, confirmation_token, email_change, email_change_token_new, recovery_token)
values
  ('71000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','scope-guide@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),
   '{"provider":"email"}','{}', now(), now(), false,'','','','');

insert into public.profiles (id, role, email, full_name, account_status)
values ('71000000-0000-4000-8000-000000000001','guide','scope-guide@example.test','Guide','active')
on conflict (id) do update
  set role = excluded.role, account_status = excluded.account_status;

insert into public.guide_profiles (user_id, slug, verification_status)
values ('71000000-0000-4000-8000-000000000001','scope-guide','approved')
on conflict (user_id) do update set verification_status = excluded.verification_status;

-- A legacy per_person tour, seeded by the trusted backend (no JWT).
insert into public.guide_templates (id, guide_id, title, price_from_kopecks, price_scope, status)
values ('71000000-0000-4000-8000-0000000000aa',
        '71000000-0000-4000-8000-000000000001','Legacy tour',500000,'per_person','draft');

-- Act as the guide, i.e. exactly what a direct authenticated supabase-js write does.
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated', true);
select set_config('request.jwt.claim.sub','71000000-0000-4000-8000-000000000001', true);

-- 1. Direct write asking for per-person money is accepted.
select lives_ok(
  $$insert into public.guide_templates (id, guide_id, title, price_from_kopecks, price_scope)
    values ('71000000-0000-4000-8000-0000000000b1',
            '71000000-0000-4000-8000-000000000001','Direct per person',400000,'per_person')$$,
  'authenticated insert with price_scope=per_person is accepted');

select is(
  (select price_scope from public.guide_templates where id='71000000-0000-4000-8000-0000000000b1'),
  'per_person',
  'a new per_person ready tour persists its scope');

-- 2. Omitting price_scope still defaults to per_group.
select lives_ok(
  $$insert into public.guide_templates (id, guide_id, title, price_from_kopecks)
    values ('71000000-0000-4000-8000-0000000000b2',
            '71000000-0000-4000-8000-000000000001','Default scope',400000)$$,
  'authenticated insert without price_scope is accepted');

select is(
  (select price_scope from public.guide_templates where id='71000000-0000-4000-8000-0000000000b2'),
  'per_group',
  'a new ready tour defaults to per_group');

-- 3. A per_group tour may be switched to per-person money.
select lives_ok(
  $$update public.guide_templates set price_scope='per_person'
      where id='71000000-0000-4000-8000-0000000000b2'$$,
  'per_group tour may be updated to per_person');

-- 4. Legacy rows are not reinterpreted and stay editable.
select is(
  (select price_scope from public.guide_templates where id='71000000-0000-4000-8000-0000000000aa'),
  'per_person',
  'legacy tour keeps its historic per_person scope');

select lives_ok(
  $$update public.guide_templates
      set title='Legacy tour edited', price_from_kopecks=600000, status='pending_review'
      where id='71000000-0000-4000-8000-0000000000aa'$$,
  'legacy per_person tour remains editable');

-- 5. Correcting a legacy row forward to per_group is allowed.
select lives_ok(
  $$update public.guide_templates set price_scope='per_group'
      where id='71000000-0000-4000-8000-0000000000aa'$$,
  'legacy tour may be corrected forward to per_group');

select * from finish();
rollback;
