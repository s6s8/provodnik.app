-- D17-3 — the admin location catalogue is an authority boundary, not a UI suggestion.
-- Proves enforce_active_catalog_location() stops a guide from writing an arbitrary or
-- retired location onto a ready tour (guide_templates.region) or a Photobank asset
-- (guide_location_photos.location_name) with their own JWT, while legacy free-text rows
-- stay readable and stay editable on every other field.
begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(14);

-- Actors: one guide (owns the rows), one admin.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  is_sso_user, confirmation_token, email_change, email_change_token_new, recovery_token)
values
  ('7e000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','loc-guide@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),
   '{"provider":"email"}','{}', now(), now(), false,'','','',''),
  ('7e000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','loc-admin@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),
   '{"provider":"email"}','{}', now(), now(), false,'','','','');

-- auth.users inserts fire handle_new_user() which seeds profiles; upsert the role.
insert into public.profiles (id, role, email, full_name, account_status)
values
  ('7e000000-0000-4000-8000-000000000001','guide','loc-guide@example.test','Guide','active'),
  ('7e000000-0000-4000-8000-000000000002','admin','loc-admin@example.test','Admin','active')
on conflict (id) do update
  set role = excluded.role, account_status = excluded.account_status;

insert into public.guide_profiles (user_id, slug, verification_status)
values ('7e000000-0000-4000-8000-000000000001','loc-guide','approved')
on conflict (user_id) do update set verification_status = excluded.verification_status;

-- Catalogue: one active location, one retired location.
insert into public.guide_location_catalog (id, name, status)
values
  ('7f000000-0000-4000-8000-000000000001','Батуми','active'),
  ('7f000000-0000-4000-8000-000000000002','Старая Гагра','retired')
on conflict (id) do nothing;

-- A legacy ready tour written before the catalogue existed: free text, never reviewed.
insert into public.guide_templates (id, guide_id, title, region, status, price_from_kopecks)
values ('7e000000-0000-4000-8000-0000000000aa','7e000000-0000-4000-8000-000000000001',
        'Легаси-тур','Отсебятина у маяка','draft',100000);

-- A legacy Photobank asset with the same problem.
insert into public.storage_assets (id, owner_id, bucket_id, object_path, asset_kind)
values
  ('7e000000-0000-4000-8000-0000000000b1','7e000000-0000-4000-8000-000000000001',
   'guide-portfolio','loc-guide/legacy.jpg','guide-portfolio'),
  ('7e000000-0000-4000-8000-0000000000b2','7e000000-0000-4000-8000-000000000001',
   'guide-portfolio','loc-guide/fresh.jpg','guide-portfolio');

insert into public.guide_location_photos (id, guide_id, storage_asset_id, location_name, sort_order)
values ('7e000000-0000-4000-8000-0000000000cc','7e000000-0000-4000-8000-000000000001',
        '7e000000-0000-4000-8000-0000000000b1','Отсебятина у маяка',0);

-- Act as the guide, the way PostgREST does.
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated', true);
select set_config('request.jwt.claim.sub','7e000000-0000-4000-8000-000000000001', true);

-- ---------------------------------------------------------------- ready tours (region)

-- 1. A brand-new tour in an active catalogue location is fine.
select lives_ok(
  $$insert into public.guide_templates (id, guide_id, title, region, status)
    values ('7e000000-0000-4000-8000-0000000000a1',
            '7e000000-0000-4000-8000-000000000001','Новый тур','Батуми','draft')$$,
  'guide can create a ready tour in an ACTIVE catalogue location');

-- 2. Invented free text is rejected at the data boundary, not just in the browser.
select throws_ok(
  $$insert into public.guide_templates (id, guide_id, title, region, status)
    values ('7e000000-0000-4000-8000-0000000000a2',
            '7e000000-0000-4000-8000-000000000001','Тур','Моя выдуманная локация','draft')$$,
  '23514', null,
  'guide cannot POST an arbitrary region onto a new ready tour');

-- 3. A retired location is not selectable either.
select throws_ok(
  $$insert into public.guide_templates (id, guide_id, title, region, status)
    values ('7e000000-0000-4000-8000-0000000000a3',
            '7e000000-0000-4000-8000-000000000001','Тур','Старая Гагра','draft')$$,
  '23514', null,
  'guide cannot POST a RETIRED catalogue location onto a new ready tour');

-- 4. Same rule on PATCH of an existing tour.
select throws_ok(
  $$update public.guide_templates set region='Моя выдуманная локация'
      where id='7e000000-0000-4000-8000-0000000000a1'$$,
  '23514', null,
  'guide cannot PATCH a ready tour to an arbitrary region');

-- 5. A location left unstated stays allowed — this governs which, not whether.
select lives_ok(
  $$update public.guide_templates set region=null
      where id='7e000000-0000-4000-8000-0000000000a1'$$,
  'a null region is still accepted');

-- ------------------------------------------------------------------- legacy tolerance

-- 6. The legacy row survived the migration unchanged.
select is(
  (select region from public.guide_templates where id='7e000000-0000-4000-8000-0000000000aa'),
  'Отсебятина у маяка',
  'legacy free-text region is not retroactively rewritten');

-- 7. An unrelated edit on that legacy row is NOT blocked by its stale location.
select lives_ok(
  $$update public.guide_templates set price_from_kopecks=250000
      where id='7e000000-0000-4000-8000-0000000000aa'$$,
  'legacy row stays editable on unrelated fields');

-- 8. Re-saving the same legacy location (the authoring form resubmits it) is not a change.
select lives_ok(
  $$update public.guide_templates set region='Отсебятина у маяка', title='Легаси-тур 2'
      where id='7e000000-0000-4000-8000-0000000000aa'$$,
  'resubmitting the unchanged legacy region is not treated as a location change');

-- 9. But explicitly moving it to another invalid location IS blocked.
select throws_ok(
  $$update public.guide_templates set region='Другая отсебятина'
      where id='7e000000-0000-4000-8000-0000000000aa'$$,
  '23514', null,
  'changing a legacy region to another off-catalogue value is blocked');

-- 10. And moving it onto the catalogue works — the upgrade path stays open.
select lives_ok(
  $$update public.guide_templates set region='Батуми'
      where id='7e000000-0000-4000-8000-0000000000aa'$$,
  'legacy row can be migrated onto an active catalogue location');

-- ------------------------------------------------------------- photobank (location_name)

-- 11. Photobank uploads take the same catalogue.
select lives_ok(
  $$insert into public.guide_location_photos
      (id, guide_id, storage_asset_id, location_name, sort_order)
    values ('7e000000-0000-4000-8000-0000000000c1',
            '7e000000-0000-4000-8000-000000000001',
            '7e000000-0000-4000-8000-0000000000b2','Батуми',1)$$,
  'guide can attach a Photobank asset to an ACTIVE catalogue location');

-- 12. Free text is refused at the data boundary, closing the direct-write bypass.
select throws_ok(
  $$update public.guide_location_photos set location_name='Смотровая у старого маяка'
      where id='7e000000-0000-4000-8000-0000000000c1'$$,
  '23514', null,
  'guide cannot write free text into a Photobank location');

-- 13. Reordering a legacy photo is untouched by its stale location.
select lives_ok(
  $$update public.guide_location_photos set sort_order=5
      where id='7e000000-0000-4000-8000-0000000000cc'$$,
  'legacy Photobank row stays reorderable');

-- ---------------------------------------------------------------------------- admin

-- 14. Admins are the catalogue owners and are not fenced by it.
select set_config('request.jwt.claim.sub','7e000000-0000-4000-8000-000000000002', true);
select lives_ok(
  $$update public.guide_templates set region='Кураторская правка'
      where id='7e000000-0000-4000-8000-0000000000a1'$$,
  'admin can still set any region');

select finish();
rollback;
