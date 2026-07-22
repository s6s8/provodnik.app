begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(8);

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

-- Drop the unique index so we can seed historical duplicates like pre-migration prod.
drop index if exists public.notifications_new_offer_once_idx;

insert into public.notifications (
  id, user_id, kind, title, href, entity_type, entity_id, payload, created_at
)
values
  (
    '81000000-0000-4000-8000-000000000101',
    '81000000-0000-4000-8000-000000000001',
    'new_offer',
    'Новое предложение',
    '/requests/82000000-0000-4000-8000-000000000001?offer=83000000-0000-4000-8000-000000000001',
    'offer',
    '83000000-0000-4000-8000-000000000001',
    '{"offer_id":"83000000-0000-4000-8000-000000000001"}'::jsonb,
    timezone('utc', now()) - interval '2 hours'
  ),
  (
    '81000000-0000-4000-8000-000000000102',
    '81000000-0000-4000-8000-000000000001',
    'new_offer',
    'Новое предложение (дубликат)',
    '/requests/82000000-0000-4000-8000-000000000001?offer=83000000-0000-4000-8000-000000000001',
    'offer',
    '83000000-0000-4000-8000-000000000001',
    '{"offer_id":"83000000-0000-4000-8000-000000000001"}'::jsonb,
    timezone('utc', now()) - interval '1 hour'
  ),
  (
    '81000000-0000-4000-8000-000000000103',
    '81000000-0000-4000-8000-000000000001',
    'new_offer',
    'Новое предложение (другой оффер)',
    '/requests/82000000-0000-4000-8000-000000000001?offer=83000000-0000-4000-8000-000000000002',
    'offer',
    '83000000-0000-4000-8000-000000000002',
    '{"offer_id":"83000000-0000-4000-8000-000000000002"}'::jsonb,
    timezone('utc', now())
  );

select is(
  (
    select count(*)::int
    from public.notifications
    where user_id = '81000000-0000-4000-8000-000000000001'
      and kind = 'new_offer'
      and entity_id = '83000000-0000-4000-8000-000000000001'
  ),
  2,
  'fixture seeds duplicate new_offer rows for the same offer'
);

-- Same dedupe statement as the migration (idempotent on reruns).
with ranked as (
  select
    id,
    row_number() over (
      partition by user_id, entity_id
      order by created_at asc, id asc
    ) as rn
  from public.notifications
  where kind = 'new_offer'::public.notification_kind
    and entity_id is not null
)
delete from public.notifications n
using ranked r
where n.id = r.id
  and r.rn > 1;

select is(
  (
    select count(*)::int
    from public.notifications
    where user_id = '81000000-0000-4000-8000-000000000001'
      and kind = 'new_offer'
      and entity_id = '83000000-0000-4000-8000-000000000001'
  ),
  1,
  'dedupe keeps one canonical new_offer row per traveler and offer'
);

select is(
  (
    select id::text
    from public.notifications
    where user_id = '81000000-0000-4000-8000-000000000001'
      and kind = 'new_offer'
      and entity_id = '83000000-0000-4000-8000-000000000001'
  ),
  '81000000-0000-4000-8000-000000000101',
  'canonical row is the earliest notification'
);

select is(
  (
    select count(*)::int
    from public.notifications
    where user_id = '81000000-0000-4000-8000-000000000001'
      and kind = 'new_offer'
      and entity_id = '83000000-0000-4000-8000-000000000002'
  ),
  1,
  'dedupe does not remove distinct offers for the same traveler'
);

with ranked as (
  select
    id,
    row_number() over (
      partition by user_id, entity_id
      order by created_at asc, id asc
    ) as rn
  from public.notifications
  where kind = 'new_offer'::public.notification_kind
    and entity_id is not null
)
delete from public.notifications n
using ranked r
where n.id = r.id
  and r.rn > 1;

select is(
  (
    select count(*)::int
    from public.notifications
    where user_id = '81000000-0000-4000-8000-000000000001'
      and kind = 'new_offer'
  ),
  2,
  'dedupe rerun is a no-op once duplicates are gone'
);

create unique index notifications_new_offer_once_idx
  on public.notifications (user_id, entity_id)
  where kind = 'new_offer'::public.notification_kind
    and entity_id is not null;

select is(
  (
    select count(*)::int
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'notifications'
      and indexname = 'notifications_new_offer_once_idx'
  ),
  1,
  'unique partial index exists after dedupe'
);

select lives_ok(
  $$
    insert into public.notifications (user_id, kind, title, href, entity_type, entity_id, payload)
    values (
      '81000000-0000-4000-8000-000000000001',
      'new_offer',
      'Новое предложение (третий оффер)',
      '/requests/82000000-0000-4000-8000-000000000001?offer=83000000-0000-4000-8000-000000000003',
      'offer',
      '83000000-0000-4000-8000-000000000003',
      '{"offer_id":"83000000-0000-4000-8000-000000000003"}'::jsonb
    )
  $$,
  'a distinct offer still inserts after dedupe and index creation'
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
