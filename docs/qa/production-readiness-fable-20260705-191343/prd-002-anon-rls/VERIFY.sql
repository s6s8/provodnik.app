-- PRD-002 — introspection to confirm the anon-access policy is live.
-- Read-only. Run BEFORE and AFTER APPLY.sql and compare.

-- 1) Current SELECT policy definition on traveler_requests.
--    BEFORE apply: the `qual` will NOT contain the bare `status = 'open'` anon
--    branch (older policy gated all reads behind auth.uid()).
--    AFTER apply:  `qual` must contain `(status = 'open'::request_status)` as a
--    top-level OR branch, and `roles` must include `public` (or {anon,...}).
select
  policyname,
  cmd,
  roles,
  qual
from pg_policies
where schemaname = 'public'
  and tablename = 'traveler_requests'
  and cmd = 'SELECT'
order by policyname;

-- 2) Confirm RLS is enabled on the table (policy has no effect otherwise).
select relname, relrowsecurity, relforcerowsecurity
from pg_class
where relname = 'traveler_requests'
  and relnamespace = 'public'::regnamespace;

-- 3) Ground truth: is there at least one open row that SHOULD become anon-visible?
--    Run as the operator/service role. If this returns >0 but the anon REST probe
--    (README.md) returns 0 rows, the policy is still not applied.
select count(*) as open_rows
from public.traveler_requests
where status = 'open';

-- 4) Optional functional check inside SQL: simulate the anonymous role.
--    Wrap in a transaction and ROLLBACK so nothing changes.
begin;
  set local role anon;
  select count(*) as anon_visible_open_rows
  from public.traveler_requests
  where status = 'open';
  reset role;
rollback;
