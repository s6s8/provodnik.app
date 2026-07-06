-- Row #35 (P0 SEC): suspended/archived accounts must be blocked at the DB
-- boundary, not just by app-layer route guards. assert_active_account() is the
-- shared chokepoint called at the top of every SECURITY DEFINER write RPC.
begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(3);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values
  (
    '42000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'lockout-active@example.test',
    extensions.crypt('LockoutActive123!', extensions.gen_salt('bf')),
    timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb, timezone('utc', now()), timezone('utc', now()), false, '', '', '', ''
  ),
  (
    '42000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'lockout-suspended@example.test',
    extensions.crypt('LockoutSuspended123!', extensions.gen_salt('bf')),
    timezone('utc', now()), '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb, timezone('utc', now()), timezone('utc', now()), false, '', '', '', ''
  )
on conflict (id) do update set updated_at = timezone('utc', now());

insert into public.profiles (id, role, email, full_name, account_status)
values
  ('42000000-0000-4000-8000-000000000001', 'traveler', 'lockout-active@example.test', 'Active One', 'active'),
  ('42000000-0000-4000-8000-000000000002', 'traveler', 'lockout-suspended@example.test', 'Suspended One', 'suspended')
on conflict (id) do update set account_status = excluded.account_status;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);

-- Active account passes the assertion.
select set_config('request.jwt.claim.sub', '42000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$ select public.assert_active_account() $$,
  'active account passes assert_active_account'
);

-- Suspended account is blocked.
select set_config('request.jwt.claim.sub', '42000000-0000-4000-8000-000000000002', true);
select throws_ok(
  $$ select public.assert_active_account() $$,
  'account_not_active',
  'suspended account is blocked by assert_active_account'
);

-- Guard is wired into a real write RPC (accept_offer aborts on status before
-- touching offer logic, so a bad offer id still surfaces account_not_active).
select throws_ok(
  $$ select public.accept_offer('00000000-0000-4000-8000-0000000000ff') $$,
  'account_not_active',
  'suspended account is blocked inside accept_offer before offer lookup'
);

select * from finish();
rollback;
