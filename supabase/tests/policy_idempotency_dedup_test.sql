begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(13);

select is(
  (
    select count(*)::integer
      from pg_policies
     where schemaname = 'public'
       and tablename = 'notifications'
       and cmd = 'SELECT'
  ),
  1,
  'notifications has one SELECT policy'
);

select is(
  (
    select count(*)::integer
      from pg_policies
     where schemaname = 'public'
       and tablename = 'notifications'
       and cmd = 'UPDATE'
  ),
  1,
  'notifications has one UPDATE policy'
);

select is(
  (
    select count(*)::integer
      from pg_policies
     where schemaname = 'public'
       and tablename = 'notifications'
       and cmd = 'INSERT'
  ),
  1,
  'notifications has one INSERT policy'
);

select is(
  (
    select count(*)::integer
      from pg_policies
     where schemaname = 'public'
       and tablename = 'notifications'
       and cmd = 'DELETE'
  ),
  1,
  'notifications has one DELETE policy'
);

select is(
  (
    select count(*)::integer
      from pg_policies
     where schemaname = 'public'
       and tablename = 'notifications'
       and policyname in (
         'notifications_owner',
         'notifications_owner_only',
         'notifications_select_own',
         'notifications_select_admin',
         'notifications_update_own'
       )
  ),
  0,
  'legacy split notification policies are removed'
);

select ok(
  (
    select with_check is not null
       and with_check like '%auth.uid%'
       and with_check like '%user_id%'
      from pg_policies
     where schemaname = 'public'
       and tablename = 'notifications'
       and policyname = 'notifications_insert'
  ),
  'notifications_insert constrains new rows to the actor or admin'
);

select ok(
  (
    select with_check is not null
       and with_check like '%auth.uid%'
       and with_check like '%user_id%'
      from pg_policies
     where schemaname = 'public'
       and tablename = 'notifications'
       and policyname = 'notifications_update'
  ),
  'notifications_update has an explicit owner WITH CHECK'
);

select ok(
  (
    select with_check is not null
       and with_check like '%guide_id%'
      from pg_policies
     where schemaname = 'public'
       and tablename = 'listings'
       and policyname = 'listings_update'
  ),
  'listings_update has an explicit guide ownership WITH CHECK'
);

select ok(
  (
    select with_check is not null
       and with_check like '%traveler_id%'
      from pg_policies
     where schemaname = 'public'
       and tablename = 'traveler_requests'
       and policyname = 'traveler_requests_update'
  ),
  'traveler_requests_update has an explicit traveler ownership WITH CHECK'
);

select ok(
  (
    select with_check is not null
       and with_check like '%guide_id%'
      from pg_policies
     where schemaname = 'public'
       and tablename = 'guide_offers'
       and policyname = 'guide_offers_update'
  ),
  'guide_offers_update has an explicit guide ownership WITH CHECK'
);

select ok(
  (
    select with_check is not null
       and with_check like '%is_admin%'
      from pg_policies
     where schemaname = 'public'
       and tablename = 'bookings'
       and policyname = 'bookings_update'
  ),
  'bookings_update is admin-only; parties use transition_booking'
);

select ok(
  (
    select with_check is not null
       and with_check like '%traveler_id%'
      from pg_policies
     where schemaname = 'public'
       and tablename = 'reviews'
       and policyname = 'reviews_update'
  ),
  'reviews_update has an explicit traveler ownership WITH CHECK'
);

select ok(
  not exists (
    select 1
      from pg_policies
     where schemaname = 'public'
       and tablename in (
         'notifications',
         'listings',
         'traveler_requests',
         'guide_offers',
         'bookings',
         'reviews'
       )
       and policyname in (
         'notifications_insert',
         'notifications_update',
         'listings_update',
         'traveler_requests_update',
         'guide_offers_update',
         'bookings_update',
         'reviews_update'
       )
       and with_check is null
  ),
  'canonical write policies do not rely on implicit WITH CHECK behavior'
);

select * from finish();

rollback;
