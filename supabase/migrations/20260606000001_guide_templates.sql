create table if not exists guide_templates (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references guide_profiles(user_id) on delete cascade,
  title text not null,
  description text,
  duration_text text,
  price_from_kopecks bigint,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table guide_templates enable row level security;

create policy "guide_templates_select_own"
  on guide_templates for select
  using (auth.uid() = guide_id);

create policy "guide_templates_insert_own"
  on guide_templates for insert
  with check (auth.uid() = guide_id);

create policy "guide_templates_update_own"
  on guide_templates for update
  using (auth.uid() = guide_id)
  with check (auth.uid() = guide_id);

create policy "guide_templates_delete_own"
  on guide_templates for delete
  using (auth.uid() = guide_id);
