-- #53: admin request lifecycle — block, unblock, safe delete, discoverability.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(38);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  is_sso_user, confirmation_token, email_change, email_change_token_new, recovery_token)
values
  ('53000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','arl-trav@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),'{"provider":"email"}','{}', now(), now(), false,'','','',''),
  ('53000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','arl-guide@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),'{"provider":"email"}','{}', now(), now(), false,'','','',''),
  ('53000000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','arl-admin@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),'{"provider":"email","role":"admin"}','{}', now(), now(), false,'','','',''),
  ('53000000-0000-4000-8000-000000000004','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','arl-other@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),'{"provider":"email"}','{}', now(), now(), false,'','','','');

insert into public.profiles (id, role, email, full_name, account_status)
values
  ('53000000-0000-4000-8000-000000000001','traveler','arl-trav@example.test','Traveler','active'),
  ('53000000-0000-4000-8000-000000000002','guide','arl-guide@example.test','Guide','active'),
  ('53000000-0000-4000-8000-000000000003','admin','arl-admin@example.test','Admin','active'),
  ('53000000-0000-4000-8000-000000000004','traveler','arl-other@example.test','Other','active')
on conflict (id) do update set role=excluded.role, account_status=excluded.account_status;

insert into public.guide_profiles (user_id, verification_status, is_available, slug)
values ('53000000-0000-4000-8000-000000000002', 'approved', true, 'arl-guide')
on conflict (user_id) do update set verification_status='approved', is_available=true;

insert into public.traveler_requests (id, traveler_id, destination, region, status,
        participants_count, starts_on, ends_on, open_to_join, format_preference)
values
  ('53000000-0000-4000-8000-0000000000a1','53000000-0000-4000-8000-000000000001',
   'Казань','Татарстан','open',2,(now()+interval '10 days')::date,(now()+interval '12 days')::date,true,'group'),
  ('53000000-0000-4000-8000-0000000000a2','53000000-0000-4000-8000-000000000001',
   'Сочи','Краснодар','booked',2,(now()+interval '20 days')::date,(now()+interval '22 days')::date,false,'private'),
  ('53000000-0000-4000-8000-0000000000a3','53000000-0000-4000-8000-000000000001',
   'Самара','Самарская','open',2,(now()+interval '15 days')::date,(now()+interval '17 days')::date,true,'group');

insert into public.bookings (id, traveler_id, guide_id, request_id, status, party_size,
        subtotal_minor, currency, cancellation_policy_snapshot)
values ('53000000-0000-4000-8000-0000000000b1','53000000-0000-4000-8000-000000000001',
        '53000000-0000-4000-8000-000000000002','53000000-0000-4000-8000-0000000000a2',
        'confirmed',2,500000,'RUB','{}'::jsonb);

insert into public.guide_offers (id, request_id, guide_id, price_minor, currency, status, starts_at, ends_at)
values
  ('53000000-0000-4000-8000-0000000000f1','53000000-0000-4000-8000-0000000000a1',
   '53000000-0000-4000-8000-000000000002',100000,'RUB','pending',
   ((now()+interval '10 days')::date + time '10:00') at time zone 'Europe/Moscow',
   ((now()+interval '10 days')::date + time '14:00') at time zone 'Europe/Moscow'),
  ('53000000-0000-4000-8000-0000000000f3','53000000-0000-4000-8000-0000000000a3',
   '53000000-0000-4000-8000-000000000002',120000,'RUB','pending',
   ((now()+interval '15 days')::date + time '10:00') at time zone 'Europe/Moscow',
   ((now()+interval '15 days')::date + time '14:00') at time zone 'Europe/Moscow');

-- Public view includes the open request before moderation.
select isnt_empty(
  $$ select 1 from public.v_public_open_requests where id = '53000000-0000-4000-8000-0000000000a1' $$,
  'open request is publicly discoverable before block');

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated', true);
select set_config('request.jwt.claim.sub','53000000-0000-4000-8000-000000000001', true);

-- Guide can update own offer on a live (non-moderated) request.
select set_config('request.jwt.claim.sub','53000000-0000-4000-8000-000000000002', true);
select lives_ok(
  $$update public.guide_offers set price_minor = 110000
     where id = '53000000-0000-4000-8000-0000000000f1'$$,
  'guide can update offer on live request');

-- Owner may still edit ordinary fields before moderation.
select set_config('request.jwt.claim.sub','53000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$update public.traveler_requests set destination = 'Казань (edited)'
     where id = '53000000-0000-4000-8000-0000000000a1'$$,
  'owner can edit non-lifecycle fields on an open request');

-- Direct lifecycle PATCH bypasses are rejected for owners.
select throws_ok(
  $$update public.traveler_requests set admin_blocked_at = now()
     where id = '53000000-0000-4000-8000-0000000000a1'$$,
  'request_lifecycle_not_editable',
  'owner cannot PATCH admin_blocked_at');

select throws_ok(
  $$update public.traveler_requests set admin_blocked_by = '53000000-0000-4000-8000-000000000001'
     where id = '53000000-0000-4000-8000-0000000000a1'$$,
  'request_lifecycle_not_editable',
  'owner cannot PATCH admin_blocked_by');

select throws_ok(
  $$update public.traveler_requests set admin_block_reason = 'self-block'
     where id = '53000000-0000-4000-8000-0000000000a1'$$,
  'request_lifecycle_not_editable',
  'owner cannot PATCH admin_block_reason');

select throws_ok(
  $$update public.traveler_requests set deleted_at = now()
     where id = '53000000-0000-4000-8000-0000000000a1'$$,
  'request_lifecycle_not_editable',
  'owner cannot PATCH deleted_at');

select throws_ok(
  $$update public.traveler_requests set deleted_by = '53000000-0000-4000-8000-000000000001'
     where id = '53000000-0000-4000-8000-0000000000a1'$$,
  'request_lifecycle_not_editable',
  'owner cannot PATCH deleted_by');

select throws_ok(
  $$update public.traveler_requests set admin_delete_reason = 'self-delete'
     where id = '53000000-0000-4000-8000-0000000000a1'$$,
  'request_lifecycle_not_editable',
  'owner cannot PATCH admin_delete_reason');

-- Non-admin cannot block via RPC.
select throws_ok(
  $$select public.admin_block_traveler_request('53000000-0000-4000-8000-0000000000a1', 'spam')$$,
  'unauthorized', 'traveler cannot block requests');

-- Admin blocks the open request.
select set_config('request.jwt.claim.sub','53000000-0000-4000-8000-000000000003', true);
select lives_ok(
  $$select public.admin_block_traveler_request('53000000-0000-4000-8000-0000000000a1', 'spam')$$,
  'admin blocks open request');

select is(
  (select admin_blocked_at is not null from public.traveler_requests where id='53000000-0000-4000-8000-0000000000a1'),
  true, 'block timestamp is set');

-- Public view excludes blocked request.
select is_empty(
  $$ select 1 from public.v_public_open_requests where id = '53000000-0000-4000-8000-0000000000a1' $$,
  'blocked request is excluded from public view');

-- Guide cannot read blocked request via discovery RLS.
select set_config('request.jwt.claim.sub','53000000-0000-4000-8000-000000000002', true);

select is(
  (select status::text from public.guide_offers where id='53000000-0000-4000-8000-0000000000f1'),
  'declined', 'block RPC declines pending offer');

select is_empty(
  $$ update public.guide_offers
       set status = 'pending', updated_at = now()
     where id = '53000000-0000-4000-8000-0000000000f1'
     returning id $$,
  'guide UPDATE on blocked request returns no rows');

select is(
  (select status::text from public.guide_offers where id='53000000-0000-4000-8000-0000000000f1'),
  'declined', 'declined offer on blocked request stays declined after guide UPDATE attempt');

select is_empty(
  $$ select 1 from public.traveler_requests where id = '53000000-0000-4000-8000-0000000000a1' $$,
  'guide cannot discover blocked request');

-- Owner cannot read their blocked request in traveler-facing reads.
select set_config('request.jwt.claim.sub','53000000-0000-4000-8000-000000000001', true);
select is_empty(
  $$ select 1 from public.traveler_requests where id = '53000000-0000-4000-8000-0000000000a1' $$,
  'owner cannot read blocked request');

-- Owner cannot counter-offer on a blocked request.
select throws_ok(
  $$select public.counter_offer('53000000-0000-4000-8000-0000000000f1', 90000, 'ниже')$$,
  'P0001',
  'request_unavailable',
  'counter_offer rejects blocked request');

-- Guide cannot insert offer on blocked request.
select set_config('request.jwt.claim.sub','53000000-0000-4000-8000-000000000002', true);
select throws_ok(
  $$insert into public.guide_offers (request_id, guide_id, price_minor, currency, status, starts_at, ends_at)
    values (
      '53000000-0000-4000-8000-0000000000a1',
      '53000000-0000-4000-8000-000000000002',
      100000,
      'RUB',
      'pending',
      ((now()+interval '10 days')::date + time '10:00') at time zone 'Europe/Moscow',
      ((now()+interval '10 days')::date + time '14:00') at time zone 'Europe/Moscow'
    )$$,
  'new row violates row-level security policy for table "guide_offers"',
  'guide offer insert blocked on moderated request');

-- Other traveler cannot join blocked request.
select set_config('request.jwt.claim.sub','53000000-0000-4000-8000-000000000004', true);
select throws_ok(
  $$insert into public.open_request_members (request_id, traveler_id, status, joined_at)
    values ('53000000-0000-4000-8000-0000000000a1','53000000-0000-4000-8000-000000000004','joined', now())$$,
  'new row violates row-level security policy for table "open_request_members"',
  'join blocked on moderated request');

-- Admin unblocks the open request.
select set_config('request.jwt.claim.sub','53000000-0000-4000-8000-000000000003', true);
select lives_ok(
  $$select public.admin_unblock_traveler_request('53000000-0000-4000-8000-0000000000a1')$$,
  'admin unblocks open request');

select isnt_empty(
  $$ select 1 from public.v_public_open_requests where id = '53000000-0000-4000-8000-0000000000a1' $$,
  'unblocked request returns to public view');

-- Cannot unblock a booked request (not originally open for restore semantics).
select throws_ok(
  $$select public.admin_block_traveler_request('53000000-0000-4000-8000-0000000000a2', 'test')$$,
  'not_blockable', 'booked request cannot be blocked');

-- Admin soft-deletes the open request.
select lives_ok(
  $$select public.admin_delete_traveler_request('53000000-0000-4000-8000-0000000000a1', 'policy')$$,
  'admin soft-deletes request');

select is(
  (select deleted_at is not null from public.traveler_requests where id='53000000-0000-4000-8000-0000000000a1'),
  true, 'deleted_at is set');

select is_empty(
  $$ select 1 from public.v_public_open_requests where id = '53000000-0000-4000-8000-0000000000a1' $$,
  'deleted request is excluded from public view');

-- Guide cannot insert offer on deleted request.
select set_config('request.jwt.claim.sub','53000000-0000-4000-8000-000000000002', true);

select is_empty(
  $$ update public.guide_offers
       set status = 'pending', updated_at = now()
     where id = '53000000-0000-4000-8000-0000000000f1'
     returning id $$,
  'guide UPDATE on deleted request returns no rows');

select is(
  (select status::text from public.guide_offers where id='53000000-0000-4000-8000-0000000000f1'),
  'declined', 'declined offer on deleted request stays declined after guide UPDATE attempt');

select throws_ok(
  $$insert into public.guide_offers (request_id, guide_id, price_minor, currency, status, starts_at, ends_at)
    values (
      '53000000-0000-4000-8000-0000000000a1',
      '53000000-0000-4000-8000-000000000002',
      100000,
      'RUB',
      'pending',
      ((now()+interval '10 days')::date + time '10:00') at time zone 'Europe/Moscow',
      ((now()+interval '10 days')::date + time '14:00') at time zone 'Europe/Moscow'
    )$$,
  'new row violates row-level security policy for table "guide_offers"',
  'guide offer insert blocked on deleted request');

-- Other traveler cannot join deleted request.
select set_config('request.jwt.claim.sub','53000000-0000-4000-8000-000000000004', true);
select throws_ok(
  $$insert into public.open_request_members (request_id, traveler_id, status, joined_at)
    values ('53000000-0000-4000-8000-0000000000a1','53000000-0000-4000-8000-000000000004','joined', now())$$,
  'new row violates row-level security policy for table "open_request_members"',
  'join blocked on deleted request');

-- Confirmed booking on the booked request survives deletion of a different row; booked row delete preserves booking.
select set_config('request.jwt.claim.sub','53000000-0000-4000-8000-000000000003', true);
select lives_ok(
  $$select public.admin_delete_traveler_request('53000000-0000-4000-8000-0000000000a2', 'cleanup')$$,
  'admin can soft-delete booked request');

select is(
  (select status::text from public.bookings where id='53000000-0000-4000-8000-0000000000b1'),
  'confirmed', 'confirmed booking survives request soft-delete');

select is(
  (select deleted_at is not null from public.traveler_requests where id='53000000-0000-4000-8000-0000000000a2'),
  true, 'booked request row is soft-deleted');

-- Cannot unblock a deleted request.
select throws_ok(
  $$select public.admin_unblock_traveler_request('53000000-0000-4000-8000-0000000000a1')$$,
  'request_not_found', 'deleted request cannot be unblocked');

-- Cannot delete twice.
select throws_ok(
  $$select public.admin_delete_traveler_request('53000000-0000-4000-8000-0000000000a1', 'again')$$,
  'request_not_found', 'already deleted request is rejected');

-- Admin soft-deletes the remaining open request; counter-offer must reject.
select lives_ok(
  $$select public.admin_delete_traveler_request('53000000-0000-4000-8000-0000000000a3', 'policy')$$,
  'admin soft-deletes counter-offer fixture request');

select set_config('request.jwt.claim.sub','53000000-0000-4000-8000-000000000001', true);
select throws_ok(
  $$select public.counter_offer('53000000-0000-4000-8000-0000000000f3', 90000, 'ниже')$$,
  'P0001',
  'request_unavailable',
  'counter_offer rejects deleted request');

select finish();
rollback;
