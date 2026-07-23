-- #82: payment-category help articles must not leak to anon/authenticated readers.
begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(4);

insert into public.help_articles (id, slug, category, title, body_md, position, is_published)
values
  ('8a000000-0000-4000-8000-000000000001', 'payment-test', 'payment',
   'Payment help', 'Sensitive payment copy', 1, true),
  ('8a000000-0000-4000-8000-000000000002', 'booking-test', 'booking',
   'Booking help', 'Public booking copy', 2, true)
on conflict (id) do update
  set category = excluded.category,
      title = excluded.title,
      body_md = excluded.body_md,
      position = excluded.position,
      is_published = excluded.is_published;

set local role anon;
select is_empty(
  $$ select 1 from public.help_articles where id = '8a000000-0000-4000-8000-000000000001' $$,
  'anonymous visitor cannot read payment-category help articles'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '7a000000-0000-4000-8000-000000000099', true);
select is_empty(
  $$ select 1 from public.help_articles where id = '8a000000-0000-4000-8000-000000000001' $$,
  'authenticated user cannot read payment-category help articles'
);

select isnt_empty(
  $$ select 1 from public.help_articles where id = '8a000000-0000-4000-8000-000000000002' $$,
  'authenticated user can still read published non-payment help articles'
);

set local role service_role;
select isnt_empty(
  $$ select 1 from public.help_articles where id = '8a000000-0000-4000-8000-000000000001' $$,
  'service role retains visibility for operational publish workflows'
);

select * from finish();
rollback;
