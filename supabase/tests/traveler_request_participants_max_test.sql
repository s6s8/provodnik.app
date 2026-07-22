-- D21-2: the 50-traveler ceiling is a DB boundary, because a traveler holds a
-- JWT and can write traveler_requests straight through PostgREST. Rows that
-- predate the boundary stay editable — only moving participants_count above the
-- ceiling is rejected.
begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(8);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  is_sso_user, confirmation_token, email_change, email_change_token_new, recovery_token)
values
  ('74000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'participants-max-traveler@example.test',
   extensions.crypt('x', extensions.gen_salt('bf')), now(), '{"provider":"email"}', '{}',
   now(), now(), false, '', '', '', '');

insert into public.profiles (id, role, email, full_name, account_status)
values
  ('74000000-0000-4000-8000-000000000001', 'traveler',
   'participants-max-traveler@example.test', 'Traveler', 'active')
on conflict (id) do update set role = excluded.role, account_status = excluded.account_status;

-- A legacy row above the ceiling, seeded the only way it can exist now: with the
-- guard off, exactly as rows written before the migration got there.
alter table public.traveler_requests disable trigger enforce_traveler_request_participants_max;
insert into public.traveler_requests (
  id, traveler_id, destination, starts_on, ends_on, participants_count, status
)
values ('75000000-0000-4000-8000-0000000000ff', '74000000-0000-4000-8000-000000000001',
  'Legacy', date '2026-11-10', date '2026-11-11', 51, 'open');
alter table public.traveler_requests enable trigger enforce_traveler_request_participants_max;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '74000000-0000-4000-8000-000000000001', true);

select lives_ok(
  $$
    insert into public.traveler_requests (
      id, traveler_id, destination, starts_on, ends_on, participants_count, status
    )
    values ('75000000-0000-4000-8000-000000000001', '74000000-0000-4000-8000-000000000001',
      'Одиночка', date '2026-11-10', date '2026-11-11', 1, 'open')
  $$,
  'direct traveler insert accepts 1 participant'
);

select lives_ok(
  $$
    insert into public.traveler_requests (
      id, traveler_id, destination, starts_on, ends_on, participants_count, status
    )
    values ('75000000-0000-4000-8000-000000000002', '74000000-0000-4000-8000-000000000001',
      'Полсотни', date '2026-11-10', date '2026-11-11', 50, 'open')
  $$,
  'direct traveler insert accepts 50 participants'
);

select throws_ok(
  $$
    insert into public.traveler_requests (
      id, traveler_id, destination, starts_on, ends_on, participants_count, status
    )
    values ('75000000-0000-4000-8000-000000000003', '74000000-0000-4000-8000-000000000001',
      'Перебор', date '2026-11-10', date '2026-11-11', 51, 'open')
  $$,
  '23514',
  'participants_count_above_max',
  'direct traveler insert rejects 51 participants'
);

select throws_ok(
  $$
    insert into public.traveler_requests (
      id, traveler_id, destination, starts_on, ends_on, participants_count, status
    )
    values ('75000000-0000-4000-8000-000000000004', '74000000-0000-4000-8000-000000000001',
      'Ноль', date '2026-11-10', date '2026-11-11', 0, 'open')
  $$,
  '23514',
  NULL,
  'the lower bound still rejects 0 participants'
);

select throws_ok(
  $$
    update public.traveler_requests
       set participants_count = 51
     where id = '75000000-0000-4000-8000-000000000002'
  $$,
  '23514',
  'participants_count_above_max',
  'direct traveler update cannot raise participants above 50'
);

-- Legacy row: everything except raising the count keeps working.
select lives_ok(
  $$
    update public.traveler_requests
       set destination = 'Legacy renamed'
     where id = '75000000-0000-4000-8000-0000000000ff'
  $$,
  'unrelated update to a legacy 51-participant row still succeeds'
);

select is(
  (select participants_count from public.traveler_requests
    where id = '75000000-0000-4000-8000-0000000000ff'),
  51,
  'the legacy row keeps its pre-existing participants_count'
);

select throws_ok(
  $$
    update public.traveler_requests
       set participants_count = 52
     where id = '75000000-0000-4000-8000-0000000000ff'
  $$,
  '23514',
  'participants_count_above_max',
  'a legacy row cannot push participants_count higher still'
);

select * from finish();
rollback;
