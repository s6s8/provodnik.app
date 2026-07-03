begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(9);

-- R-08 — storage bucket publicness is declared + reproducible (run as the default
-- superuser role, before switching to anon).
select is(
  (select public from storage.buckets where id = 'guide-documents'),
  false,
  'guide-documents bucket is private'
);
select is(
  (select public from storage.buckets where id = 'dispute-evidence'),
  false,
  'dispute-evidence bucket is private'
);
select is(
  (select public from storage.buckets where id = 'guide-avatars'),
  true,
  'guide-avatars bucket is public'
);
select is(
  (select public from storage.buckets where id = 'listing-media'),
  true,
  'listing-media bucket is public'
);
select is(
  (select public from storage.buckets where id = 'guide-portfolio'),
  true,
  'guide-portfolio bucket is public'
);

-- R-07 — business_leads anon insert is shape-constrained, not `WITH CHECK (true)`.
set local role anon;
select set_config('request.jwt.claim.role', 'anon', true);

select lives_ok(
  $$ insert into public.business_leads (contact, company, headcount)
       values ('+7 900 000-00-00', 'ACME Tours', 12) $$,
  'anon can insert a well-formed business lead'
);

select throws_ok(
  $$ insert into public.business_leads (contact) values ('') $$,
  '42501',
  null,
  'anon cannot insert a lead with an empty contact'
);

select throws_ok(
  $$ insert into public.business_leads (contact, note)
       values ('valid contact', repeat('x', 2001)) $$,
  '42501',
  null,
  'anon cannot insert a lead with an oversized note'
);

select throws_ok(
  $$ insert into public.business_leads (contact, headcount)
       values ('valid contact', 999999) $$,
  '42501',
  null,
  'anon cannot insert a lead with an out-of-range headcount'
);

select * from finish();

rollback;
