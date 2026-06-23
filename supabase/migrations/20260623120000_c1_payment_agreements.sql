-- C1 Payment seam (face-to-face, no gateway) — ADDITIVE + reversible.
-- payment_agreements = written "agreed price + pay-in-person" record per booking.
-- RLS MIRRORS the proven bookings_select / disputes patterns (booking parties + admin).

-- 1) Additive booking columns (idempotent)
alter table public.bookings add column if not exists payment_method text not null default 'in_person';
alter table public.bookings add column if not exists payment_status text not null default 'pending';

-- 2) payment_agreements table
create table if not exists public.payment_agreements (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  agreed_total_minor integer not null,
  currency text not null default 'RUB',
  method text not null default 'in_person',
  traveler_confirmed_at timestamptz,
  guide_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_agreements_booking_idx on public.payment_agreements (booking_id);

alter table public.payment_agreements enable row level security;

-- 3) RLS — booking parties + admin (mirror of bookings_select / disputes_insert participant check)
drop policy if exists "payment_agreements_select" on public.payment_agreements;
create policy "payment_agreements_select" on public.payment_agreements for select
  using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and ( b.traveler_id = (select auth.uid()::uuid) or b.guide_id = (select auth.uid()::uuid) )
    )
    or public.is_admin()
  );

drop policy if exists "payment_agreements_insert" on public.payment_agreements;
create policy "payment_agreements_insert" on public.payment_agreements for insert
  with check (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and ( b.traveler_id = (select auth.uid()::uuid) or b.guide_id = (select auth.uid()::uuid) )
    )
    or public.is_admin()
  );

drop policy if exists "payment_agreements_update" on public.payment_agreements;
create policy "payment_agreements_update" on public.payment_agreements for update
  using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and ( b.traveler_id = (select auth.uid()::uuid) or b.guide_id = (select auth.uid()::uuid) )
    )
    or public.is_admin()
  );

drop trigger if exists set_payment_agreements_updated_at on public.payment_agreements;
create trigger set_payment_agreements_updated_at before update on public.payment_agreements
  for each row execute procedure public.set_updated_at();
