-- C2 Availability — listing_slots (ADDITIVE). Public read of slots for PUBLISHED listings only (dates aren't PII).

create table if not exists public.listing_slots (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz,
  capacity int,
  seats_taken int not null default 0,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create index if not exists listing_slots_listing_starts_idx on public.listing_slots (listing_id, starts_at);

alter table public.listing_slots enable row level security;

drop policy if exists "listing_slots_select" on public.listing_slots;
create policy "listing_slots_select" on public.listing_slots for select
  using (
    exists (select 1 from public.listings l where l.id = listing_id and l.status = 'published')
    or public.is_admin()
  );

-- Demo seed (additive, idempotent) so the availability UI shows real data on demo listings.
insert into public.listing_slots (id, listing_id, starts_at, ends_at, capacity, seats_taken, status)
values
  ('d5000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000011', now() + interval '9 days',  now() + interval '9 days'  + interval '4 hours', 8, 2, 'open'),
  ('d5000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000011', now() + interval '16 days', now() + interval '16 days' + interval '4 hours', 8, 0, 'open'),
  ('d5000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000012', now() + interval '12 days', now() + interval '12 days' + interval '6 hours', 6, 5, 'open')
on conflict (id) do nothing;
