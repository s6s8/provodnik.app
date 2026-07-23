-- Wave 1 #91: Q&A sender role is derived; per-thread cap is enforced atomically.
begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(6);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  is_sso_user, confirmation_token, email_change, email_change_token_new, recovery_token)
values
  ('75000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','qa-trav@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),'{"provider":"email"}','{}', now(), now(), false,'','','',''),
  ('75000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000000',
   'authenticated','authenticated','qa-guide@example.test',
   extensions.crypt('x',extensions.gen_salt('bf')), now(),'{"provider":"email"}','{}', now(), now(), false,'','','','');

insert into public.profiles (id, role, email, full_name, account_status)
values
  ('75000000-0000-4000-8000-000000000001','traveler','qa-trav@example.test','T','active'),
  ('75000000-0000-4000-8000-000000000002','guide','qa-guide@example.test','G','active')
on conflict (id) do update set role=excluded.role, account_status=excluded.account_status;

insert into public.guide_profiles (user_id, slug, verification_status)
values ('75000000-0000-4000-8000-000000000002','qa-guide','approved')
on conflict (user_id) do nothing;

insert into public.traveler_requests (id, traveler_id, destination, region, status,
        participants_count, starts_on, ends_on, date_flexibility)
values ('75000000-0000-4000-8000-0000000000a1','75000000-0000-4000-8000-000000000001',
        'Элиста','Калмыкия','open',2,(now()+interval '10 days')::date,(now()+interval '12 days')::date,'few_days');

insert into public.guide_offers (id, request_id, guide_id, price_minor, currency, status)
values ('75000000-0000-4000-8000-0000000000f1','75000000-0000-4000-8000-0000000000a1',
        '75000000-0000-4000-8000-000000000002',500000,'RUB','pending');

insert into public.conversation_threads (id, subject_type, offer_id, created_by)
values ('75000000-0000-4000-8000-0000000000a2','offer','75000000-0000-4000-8000-0000000000f1',
        '75000000-0000-4000-8000-000000000001')
on conflict (id) do nothing;

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated', true);

-- Guide sending with a spoofed traveler role still stores guide.
select set_config('request.jwt.claim.sub','75000000-0000-4000-8000-000000000002', true);
select lives_ok(
  $$select public.send_qa_message(
      '75000000-0000-4000-8000-0000000000a2',
      '75000000-0000-4000-8000-000000000002',
      'traveler'::public.message_sender_role,
      'guide body')$$,
  'guide can send even if client passes traveler role');

select is(
  (select sender_role::text from public.messages
    where thread_id='75000000-0000-4000-8000-0000000000a2'
      and body='guide body'),
  'guide',
  'sender_role is derived as guide from booking parties');

-- Traveler message stores traveler role.
select set_config('request.jwt.claim.sub','75000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$select public.send_qa_message(
      '75000000-0000-4000-8000-0000000000a2',
      '75000000-0000-4000-8000-000000000001',
      'guide'::public.message_sender_role,
      'traveler body')$$,
  'traveler can send even if client passes guide role');

select is(
  (select sender_role::text from public.messages
    where thread_id='75000000-0000-4000-8000-0000000000a2'
      and body='traveler body'),
  'traveler',
  'sender_role is derived as traveler from booking parties');

-- Fill the thread to the cap.
do $fill$
declare i int;
begin
  for i in 3..8 loop
    perform public.send_qa_message(
      '75000000-0000-4000-8000-0000000000a2',
      '75000000-0000-4000-8000-000000000001',
      'traveler'::public.message_sender_role,
      'fill ' || i::text
    );
  end loop;
end;
$fill$;

select is(
  (select count(*)::int from public.messages
    where thread_id='75000000-0000-4000-8000-0000000000a2'),
  8,
  'thread holds exactly eight messages');

select throws_ok(
  $$select public.send_qa_message(
      '75000000-0000-4000-8000-0000000000a2',
      '75000000-0000-4000-8000-000000000001',
      'traveler'::public.message_sender_role,
      'one too many')$$,
  'qa_thread_at_limit',
  'ninth message is rejected at the cap');

select finish();
rollback;
