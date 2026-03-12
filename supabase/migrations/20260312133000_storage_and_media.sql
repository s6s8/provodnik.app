drop policy if exists "guide_media_bucket_select" on storage.objects;
drop policy if exists "guide_media_bucket_insert" on storage.objects;
drop policy if exists "guide_media_bucket_update" on storage.objects;
drop policy if exists "listing_media_bucket_public_read" on storage.objects;
drop policy if exists "listing_media_bucket_write" on storage.objects;
drop policy if exists "listing_media_bucket_update" on storage.objects;
drop policy if exists "dispute_evidence_bucket_related_read" on storage.objects;
drop policy if exists "dispute_evidence_bucket_write" on storage.objects;
drop policy if exists "dispute_evidence_bucket_update" on storage.objects;

drop table if exists public.dispute_evidence cascade;
drop table if exists public.listing_media cascade;
drop table if exists public.guide_documents cascade;
drop table if exists public.storage_assets cascade;

drop type if exists public.storage_asset_kind cascade;

create type public.storage_asset_kind as enum (
  'guide-avatar',
  'guide-document',
  'listing-cover',
  'listing-gallery',
  'dispute-evidence'
);

create table public.storage_assets (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  bucket_id text not null,
  object_path text not null,
  asset_kind public.storage_asset_kind not null,
  mime_type text,
  byte_size bigint,
  created_at timestamptz not null default timezone('utc', now()),
  unique (bucket_id, object_path)
);

create table public.guide_documents (
  id uuid primary key default extensions.gen_random_uuid(),
  guide_id uuid not null references public.profiles (id) on delete cascade,
  asset_id uuid not null unique references public.storage_assets (id) on delete cascade,
  document_type text not null,
  status public.guide_verification_status not null default 'submitted',
  admin_note text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.listing_media (
  id uuid primary key default extensions.gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  asset_id uuid not null unique references public.storage_assets (id) on delete cascade,
  is_cover boolean not null default false,
  sort_order integer not null default 0,
  alt_text text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.dispute_evidence (
  id uuid primary key default extensions.gen_random_uuid(),
  dispute_id uuid not null references public.disputes (id) on delete cascade,
  asset_id uuid not null unique references public.storage_assets (id) on delete cascade,
  uploaded_by uuid not null references public.profiles (id) on delete cascade,
  label text,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index listing_media_cover_unique_idx
  on public.listing_media (listing_id)
  where is_cover;

create index guide_documents_guide_status_idx
  on public.guide_documents (guide_id, status, created_at desc);

create index listing_media_listing_sort_idx
  on public.listing_media (listing_id, sort_order, created_at);

create index dispute_evidence_dispute_idx
  on public.dispute_evidence (dispute_id, created_at desc);

insert into storage.buckets (id, name, public)
values
  ('guide-media', 'guide-media', false),
  ('listing-media', 'listing-media', true),
  ('dispute-evidence', 'dispute-evidence', false)
on conflict (id) do nothing;

alter table public.storage_assets enable row level security;
alter table public.guide_documents enable row level security;
alter table public.listing_media enable row level security;
alter table public.dispute_evidence enable row level security;

create policy "storage_assets_select_owner_or_admin"
  on public.storage_assets for select
  using (owner_id = auth.uid() or public.is_admin());

create policy "storage_assets_insert_owner_or_admin"
  on public.storage_assets for insert
  with check (owner_id = auth.uid() or public.is_admin());

create policy "storage_assets_update_owner_or_admin"
  on public.storage_assets for update
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

create policy "guide_documents_select_owner_or_admin"
  on public.guide_documents for select
  using (guide_id = auth.uid() or public.is_admin());

create policy "guide_documents_insert_owner_or_admin"
  on public.guide_documents for insert
  with check (guide_id = auth.uid() or public.is_admin());

create policy "guide_documents_update_admin_or_owner"
  on public.guide_documents for update
  using (guide_id = auth.uid() or public.is_admin())
  with check (guide_id = auth.uid() or public.is_admin());

create policy "listing_media_public_select"
  on public.listing_media for select
  using (
    exists (
      select 1
      from public.listings l
      where l.id = listing_id
        and (l.status = 'published' or l.guide_id = auth.uid() or public.is_admin())
    )
  );

create policy "listing_media_insert_guide_or_admin"
  on public.listing_media for insert
  with check (
    exists (
      select 1
      from public.listings l
      where l.id = listing_id
        and (l.guide_id = auth.uid() or public.is_admin())
    )
  );

create policy "listing_media_update_guide_or_admin"
  on public.listing_media for update
  using (
    exists (
      select 1
      from public.listings l
      where l.id = listing_id
        and (l.guide_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1
      from public.listings l
      where l.id = listing_id
        and (l.guide_id = auth.uid() or public.is_admin())
    )
  );

create policy "dispute_evidence_select_related_or_admin"
  on public.dispute_evidence for select
  using (
    public.is_admin()
    or uploaded_by = auth.uid()
    or exists (
      select 1
      from public.disputes d
      join public.bookings b on b.id = d.booking_id
      where d.id = dispute_id
        and (b.traveler_id = auth.uid() or b.guide_id = auth.uid())
    )
  );

create policy "dispute_evidence_insert_related_or_admin"
  on public.dispute_evidence for insert
  with check (
    uploaded_by = auth.uid()
    and (
      public.is_admin()
      or exists (
        select 1
        from public.disputes d
        join public.bookings b on b.id = d.booking_id
        where d.id = dispute_id
          and (b.traveler_id = auth.uid() or b.guide_id = auth.uid())
      )
    )
  );

create policy "guide_media_bucket_select"
  on storage.objects for select
  using (
    bucket_id = 'guide-media'
    and (
      owner_id = (select auth.uid()::text)
      or public.is_admin()
    )
  );

create policy "guide_media_bucket_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'guide-media'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "guide_media_bucket_update"
  on storage.objects for update
  using (
    bucket_id = 'guide-media'
    and (owner_id = (select auth.uid()::text) or public.is_admin())
  )
  with check (
    bucket_id = 'guide-media'
    and (owner_id = (select auth.uid()::text) or public.is_admin())
  );

create policy "listing_media_bucket_public_read"
  on storage.objects for select
  using (bucket_id = 'listing-media');

create policy "listing_media_bucket_write"
  on storage.objects for insert
  with check (
    bucket_id = 'listing-media'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "listing_media_bucket_update"
  on storage.objects for update
  using (
    bucket_id = 'listing-media'
    and (owner_id = (select auth.uid()::text) or public.is_admin())
  )
  with check (
    bucket_id = 'listing-media'
    and (owner_id = (select auth.uid()::text) or public.is_admin())
  );

create policy "dispute_evidence_bucket_related_read"
  on storage.objects for select
  using (
    bucket_id = 'dispute-evidence'
    and (owner_id = (select auth.uid()::text) or public.is_admin())
  );

create policy "dispute_evidence_bucket_write"
  on storage.objects for insert
  with check (
    bucket_id = 'dispute-evidence'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "dispute_evidence_bucket_update"
  on storage.objects for update
  using (
    bucket_id = 'dispute-evidence'
    and (owner_id = (select auth.uid()::text) or public.is_admin())
  )
  with check (
    bucket_id = 'dispute-evidence'
    and (owner_id = (select auth.uid()::text) or public.is_admin())
  );
