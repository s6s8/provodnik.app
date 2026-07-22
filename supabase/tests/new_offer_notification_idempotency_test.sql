begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(2);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  is_sso_user, confirmation_token, email_change, email_change_token_new, recovery_token)
values
  ('81000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'offer-notif-traveler@example.test',
   extensions.crypt('x', extensions.gen_salt('bf')), now(), '{"provider":"email"}', '{}',
   now(), now(), false, '', '', '', '');

insert into public.profiles (id, role, email, full_name, account_status)
values ('81000000-0000-4000-8000-000000000001', 'traveler', 'offer-notif-traveler@example.test', 'Traveler', 'active')
on conflict (id) do update set role = excluded.role, account_status = excluded.account_status;

select lives_ok(
  $$
    insert into public.notifications (user_id, kind, title, href, entity_type, entity_id, payload)
    values (
      '81000000-0000-4000-8000-000000000001',
      'new_offer',
      'Новое предложение',
      '/requests/82000000-0000-4000-8000-000000000001?offer=83000000-0000-4000-8000-000000000001',
      'offer',
      '83000000-0000-4000-8000-000000000001',
      '{"offer_id":"83000000-0000-4000-8000-000000000001"}'::jsonb
    )
  $$,
  'first new_offer notification for an offer inserts'
);

select throws_ok(
  $$
    insert into public.notifications (user_id, kind, title, href, entity_type, entity_id, payload)
    values (
      '81000000-0000-4000-8000-000000000001',
      'new_offer',
      'Новое предложение (дубликат)',
      '/requests/82000000-0000-4000-8000-000000000001?offer=83000000-0000-4000-8000-000000000001',
      'offer',
      '83000000-0000-4000-8000-000000000001',
      '{"offer_id":"83000000-0000-4000-8000-000000000001"}'::jsonb
    )
  $$,
  '23505',
  null,
  'duplicate new_offer notification for the same offer is rejected'
);

select * from finish();

rollback;
