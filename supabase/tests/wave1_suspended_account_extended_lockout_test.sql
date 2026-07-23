-- Wave 1 #87/#90: suspended/archived accounts cannot mutate profile, templates,
-- listing children, or moderation tables through direct access.
begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(7);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  is_sso_user, confirmation_token, email_change, email_change_token_new, recovery_token)
values
  ('74000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','sus-guide@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),'{"provider":"email"}','{}', now(), now(), false,'','','',''),
  ('74000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','sus-admin@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),'{"provider":"email"}','{}', now(), now(), false,'','','',''),
  ('74000000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','sus-trav@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),'{"provider":"email"}','{}', now(), now(), false,'','','','');

insert into public.profiles (id, role, email, full_name, account_status)
values
  ('74000000-0000-4000-8000-000000000001','guide','sus-guide@example.test','G','suspended'),
  ('74000000-0000-4000-8000-000000000002','admin','sus-admin@example.test','A','suspended')
on conflict (id) do update set role=excluded.role, account_status=excluded.account_status, full_name=excluded.full_name;

insert into public.guide_profiles (user_id, slug, verification_status)
values ('74000000-0000-4000-8000-000000000001','sus-guide','approved')
on conflict (user_id) do nothing;

insert into public.listings (id, guide_id, slug, title, region, category, price_from_minor, status)
values ('74000000-0000-4000-8000-000000000001','74000000-0000-4000-8000-000000000001',
        'suspended-listing','Suspended listing','Калмыкия','excursion',100000,'draft')
on conflict (id) do nothing;

insert into public.guide_templates (
  id, guide_id, title, description, price_from_kopecks, status
)
values ('74000000-0000-4000-8000-000000000002','74000000-0000-4000-8000-000000000001',
        'Suspended template','desc',100000,'draft')
on conflict (id) do nothing;

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated', true);
select set_config('request.jwt.claim.sub','74000000-0000-4000-8000-000000000001', true);

-- Profile self-update blocked.
update public.profiles set full_name = 'Hacked' where id = '74000000-0000-4000-8000-000000000001';
select ok(
  (select full_name from public.profiles where id = '74000000-0000-4000-8000-000000000001') is distinct from 'Hacked',
  'suspended guide cannot update own profile');

-- Guide template update blocked.
update public.guide_templates set title = 'Hacked'
  where id = '74000000-0000-4000-8000-000000000002';
select ok(
  (select title from public.guide_templates where id = '74000000-0000-4000-8000-000000000002') is distinct from 'Hacked',
  'suspended guide cannot update guide_templates');

-- Guide template insert blocked.
select throws_ok(
  $$insert into public.guide_templates (guide_id, title, description, status, price_from_kopecks)
    values ('74000000-0000-4000-8000-000000000001','New','d','draft',100000)$$,
  'new row violates row-level security policy for table "guide_templates"',
  'suspended guide cannot insert guide_templates');

-- Listing child row insert blocked.
select throws_ok(
  $$insert into public.listing_photos (listing_id, url, position)
    values ('74000000-0000-4000-8000-000000000001','https://example.test/p.jpg',1)$$,
  'new row violates row-level security policy for table "listing_photos"',
  'suspended guide cannot insert listing child rows');

-- Suspended admin cannot insert moderation cases.
select set_config('request.jwt.claim.sub','74000000-0000-4000-8000-000000000002', true);
select throws_ok(
  $$insert into public.moderation_cases (subject_type, listing_id, status, opened_by, queue_reason)
    values ('listing'::public.moderation_subject,'74000000-0000-4000-8000-000000000001',
            'open','74000000-0000-4000-8000-000000000002','suspended admin test')$$,
  'new row violates row-level security policy for table "moderation_cases"',
  'suspended admin cannot insert moderation_cases');

-- cancel_traveler_request is blocked for suspended travelers.
reset role;
insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  is_sso_user, confirmation_token, email_change, email_change_token_new, recovery_token)
values ('74000000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','sus-trav@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),'{"provider":"email"}','{}', now(), now(), false,'','','','')
on conflict (id) do nothing;

insert into public.profiles (id, role, email, full_name, account_status)
values ('74000000-0000-4000-8000-000000000003','traveler','sus-trav@example.test','T','suspended')
on conflict (id) do update set account_status = excluded.account_status;

insert into public.traveler_requests (id, traveler_id, destination, region, status,
        participants_count, starts_on, ends_on)
values ('74000000-0000-4000-8000-0000000000a1','74000000-0000-4000-8000-000000000003',
        'Элиста','Калмыкия','open',2,(now()+interval '10 days')::date,(now()+interval '12 days')::date)
on conflict (id) do nothing;

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated', true);
select set_config('request.jwt.claim.sub','74000000-0000-4000-8000-000000000003', true);
select throws_ok(
  $$select public.cancel_traveler_request('74000000-0000-4000-8000-0000000000a1')$$,
  'account_not_active',
  'suspended traveler is blocked inside cancel_traveler_request');

-- transition_booking blocked for suspended party.
reset role;
insert into public.bookings (id, traveler_id, guide_id, status, party_size,
        subtotal_minor, currency, cancellation_policy_snapshot)
values ('74000000-0000-4000-8000-0000000000b1','74000000-0000-4000-8000-000000000003',
        '74000000-0000-4000-8000-000000000001','confirmed',2,500000,'RUB','{}'::jsonb)
on conflict (id) do nothing;

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated', true);
select set_config('request.jwt.claim.sub','74000000-0000-4000-8000-000000000003', true);
select throws_ok(
  $$select public.transition_booking(
      '74000000-0000-4000-8000-0000000000b1'::uuid,
      'cancelled'::public.booking_status)$$,
  'account_not_active',
  'suspended traveler is blocked inside transition_booking');

select finish();
rollback;
