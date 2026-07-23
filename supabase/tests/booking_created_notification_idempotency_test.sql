begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(8);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  is_sso_user, confirmation_token, email_change, email_change_token_new, recovery_token)
values
  ('85000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'booking-notif-guide@example.test',
   extensions.crypt('x', extensions.gen_salt('bf')), now(), '{"provider":"email"}', '{}',
   now(), now(), false, '', '', '', '');

insert into public.profiles (id, role, email, full_name, account_status)
values ('85000000-0000-4000-8000-000000000001', 'guide', 'booking-notif-guide@example.test', 'Guide', 'active')
on conflict (id) do update set role = excluded.role, account_status = excluded.account_status;

-- Drop the unique index so we can seed historical duplicates like pre-migration prod.
drop index if exists public.notifications_booking_created_once_idx;

insert into public.notifications (
  id, user_id, kind, title, href, entity_type, entity_id, payload, created_at
)
values
  (
    '85000000-0000-4000-8000-000000000101',
    '85000000-0000-4000-8000-000000000001',
    'booking_created',
    'Новое бронирование',
    '/guide/bookings/86000000-0000-4000-8000-000000000001',
    'booking',
    '86000000-0000-4000-8000-000000000001',
    '{"booking_id":"86000000-0000-4000-8000-000000000001"}'::jsonb,
    timezone('utc', now()) - interval '2 hours'
  ),
  (
    '85000000-0000-4000-8000-000000000102',
    '85000000-0000-4000-8000-000000000001',
    'booking_created',
    'Новое бронирование (дубликат)',
    '/guide/bookings/86000000-0000-4000-8000-000000000001',
    'booking',
    '86000000-0000-4000-8000-000000000001',
    '{"booking_id":"86000000-0000-4000-8000-000000000001"}'::jsonb,
    timezone('utc', now()) - interval '1 hour'
  ),
  (
    '85000000-0000-4000-8000-000000000103',
    '85000000-0000-4000-8000-000000000001',
    'booking_created',
    'Новое бронирование (другое бронирование)',
    '/guide/bookings/86000000-0000-4000-8000-000000000002',
    'booking',
    '86000000-0000-4000-8000-000000000002',
    '{"booking_id":"86000000-0000-4000-8000-000000000002"}'::jsonb,
    timezone('utc', now())
  );

select is(
  (
    select count(*)::int
    from public.notifications
    where user_id = '85000000-0000-4000-8000-000000000001'
      and kind = 'booking_created'
      and entity_id = '86000000-0000-4000-8000-000000000001'
  ),
  2,
  'fixture seeds duplicate booking_created rows for the same booking'
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
  where kind = 'booking_created'::public.notification_kind
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
    where user_id = '85000000-0000-4000-8000-000000000001'
      and kind = 'booking_created'
      and entity_id = '86000000-0000-4000-8000-000000000001'
  ),
  1,
  'dedupe keeps one canonical booking_created row per guide and booking'
);

select is(
  (
    select id::text
    from public.notifications
    where user_id = '85000000-0000-4000-8000-000000000001'
      and kind = 'booking_created'
      and entity_id = '86000000-0000-4000-8000-000000000001'
  ),
  '85000000-0000-4000-8000-000000000101',
  'canonical row is the earliest notification'
);

select is(
  (
    select count(*)::int
    from public.notifications
    where user_id = '85000000-0000-4000-8000-000000000001'
      and kind = 'booking_created'
      and entity_id = '86000000-0000-4000-8000-000000000002'
  ),
  1,
  'dedupe does not remove distinct bookings for the same guide'
);

with ranked as (
  select
    id,
    row_number() over (
      partition by user_id, entity_id
      order by created_at asc, id asc
    ) as rn
  from public.notifications
  where kind = 'booking_created'::public.notification_kind
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
    where user_id = '85000000-0000-4000-8000-000000000001'
      and kind = 'booking_created'
  ),
  2,
  'dedupe rerun is a no-op once duplicates are gone'
);

create unique index notifications_booking_created_once_idx
  on public.notifications (user_id, entity_id)
  where kind = 'booking_created'::public.notification_kind
    and entity_id is not null;

select is(
  (
    select count(*)::int
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'notifications'
      and indexname = 'notifications_booking_created_once_idx'
  ),
  1,
  'unique partial index exists after dedupe'
);

select lives_ok(
  $$
    insert into public.notifications (user_id, kind, title, href, entity_type, entity_id, payload)
    values (
      '85000000-0000-4000-8000-000000000001',
      'booking_created',
      'Новое бронирование (третье бронирование)',
      '/guide/bookings/86000000-0000-4000-8000-000000000003',
      'booking',
      '86000000-0000-4000-8000-000000000003',
      '{"booking_id":"86000000-0000-4000-8000-000000000003"}'::jsonb
    )
  $$,
  'a distinct booking still inserts after dedupe and index creation'
);

select throws_ok(
  $$
    insert into public.notifications (user_id, kind, title, href, entity_type, entity_id, payload)
    values (
      '85000000-0000-4000-8000-000000000001',
      'booking_created',
      'Новое бронирование (дубликат)',
      '/guide/bookings/86000000-0000-4000-8000-000000000001',
      'booking',
      '86000000-0000-4000-8000-000000000001',
      '{"booking_id":"86000000-0000-4000-8000-000000000001"}'::jsonb
    )
  $$,
  '23505',
  null,
  'duplicate booking_created notification for the same booking is rejected'
);

select * from finish();

rollback;
