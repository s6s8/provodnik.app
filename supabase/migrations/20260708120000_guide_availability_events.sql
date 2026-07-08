-- Append-only audit trail for guide availability changes.
-- Kept OFF guide_profiles on purpose: adding a column to guide_profiles breaks the
-- frozen search_guides rowtype (error 42804) until the refreeze migration re-runs.
create table public.guide_availability_events (
  id         uuid primary key default extensions.gen_random_uuid(),
  guide_id   uuid not null references public.guide_profiles(user_id) on delete cascade,
  actor_id   uuid not null references public.profiles(id),
  actor_role text not null check (actor_role in ('guide','admin')),
  available  boolean not null,          -- the new state written
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.guide_availability_events enable row level security;

create policy "guide_availability_events_select" on public.guide_availability_events
  for select using ((select auth.uid()) = guide_id or public.is_admin());

create policy "guide_availability_events_insert" on public.guide_availability_events
  for insert with check (
    ((select auth.uid()) = actor_id and (select auth.uid()) = guide_id) or public.is_admin()
  );

create index guide_availability_events_guide_idx
  on public.guide_availability_events (guide_id, created_at desc);
