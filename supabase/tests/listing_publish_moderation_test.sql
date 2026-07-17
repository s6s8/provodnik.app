-- Owner 609 P0: a guide must not be able to self-publish a listing.
-- Proves fn_enforce_listing_transition gates approval/rejection to admins while
-- keeping guide submission (draft→pending_review) and self-service archive working.
begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(8);

-- Actors: one guide (owns the listing), one admin.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  is_sso_user, confirmation_token, email_change, email_change_token_new, recovery_token)
values
  ('61000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','pub-guide@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),
   '{"provider":"email"}','{}', now(), now(), false,'','','',''),
  ('61000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','pub-admin@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),
   '{"provider":"email"}','{}', now(), now(), false,'','','','');

-- auth.users inserts fire handle_new_user() which seeds profiles; upsert the role.
insert into public.profiles (id, role, email, full_name, account_status)
values
  ('61000000-0000-4000-8000-000000000001','guide','pub-guide@example.test','Guide','active'),
  ('61000000-0000-4000-8000-000000000002','admin','pub-admin@example.test','Admin','active')
on conflict (id) do update
  set role = excluded.role, account_status = excluded.account_status;

insert into public.guide_profiles (user_id, slug, verification_status)
values ('61000000-0000-4000-8000-000000000001','pub-guide','approved')
on conflict (user_id) do update set verification_status = excluded.verification_status;

insert into public.listings (id, guide_id, slug, title, region, category, price_from_minor, status)
values ('61000000-0000-4000-8000-0000000000aa',
        '61000000-0000-4000-8000-000000000001','pub-listing','T','R','excursion',100000,'draft');

-- Act as the guide.
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated', true);
select set_config('request.jwt.claim.sub','61000000-0000-4000-8000-000000000001', true);

-- 1. Guide submits: draft → pending_review is allowed.
select lives_ok(
  $$update public.listings set status='pending_review'
      where id='61000000-0000-4000-8000-0000000000aa'$$,
  'guide can submit draft -> pending_review');

-- 2. Guide CANNOT self-publish: pending_review → published is blocked.
select throws_ok(
  $$update public.listings set status='published'
      where id='61000000-0000-4000-8000-0000000000aa'$$,
  '23514',
  null,
  'guide cannot self-publish pending_review -> published');

-- 3. Guide CANNOT self-reject either.
select throws_ok(
  $$update public.listings set status='rejected'
      where id='61000000-0000-4000-8000-0000000000aa'$$,
  '23514',
  null,
  'guide cannot self-reject pending_review -> rejected');

-- 4. Guide cannot jump draft-like states straight to published from any state.
select throws_ok(
  $$update public.listings set status='published'
      where id='61000000-0000-4000-8000-0000000000aa'$$,
  '23514', null,
  'guide still blocked from published (status unchanged by #2/#3)');

-- Act as the admin.
select set_config('request.jwt.claim.sub','61000000-0000-4000-8000-000000000002', true);

-- 5. Admin approves: pending_review → published works.
select lives_ok(
  $$update public.listings set status='published'
      where id='61000000-0000-4000-8000-0000000000aa'$$,
  'admin can approve pending_review -> published');

-- 6. Status actually moved to published.
select is(
  (select status::text from public.listings where id='61000000-0000-4000-8000-0000000000aa'),
  'published',
  'listing is published after admin approval');

-- Back to the guide: self-service on an approved listing.
select set_config('request.jwt.claim.sub','61000000-0000-4000-8000-000000000001', true);

-- 7. Guide can archive (unpublish) their own published listing.
select lives_ok(
  $$update public.listings set status='archived'
      where id='61000000-0000-4000-8000-0000000000aa'$$,
  'guide can archive their own published listing');

-- 8. Archived is terminal (unchanged from the original graph): no resurrection.
select throws_ok(
  $$update public.listings set status='pending_review'
      where id='61000000-0000-4000-8000-0000000000aa'$$,
  '23514', null,
  'archived is terminal — cannot transition back to pending_review');

select finish();
rollback;
