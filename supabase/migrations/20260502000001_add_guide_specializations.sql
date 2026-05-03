-- 20260502000001_add_guide_specializations.sql

alter table public.guide_profiles
  add column specializations text[] not null default '{}';

-- Constrain to canonical interest IDs (post-Plan-48 list)
alter table public.guide_profiles
  add constraint guide_specializations_valid
  check (
    specializations <@ array[
      'history',
      'architecture',
      'nature',
      'food',
      'art',
      'photo',
      'kids',
      'unusual'
    ]::text[]
  );

-- GIN index for the && overlap operator used by inbox sort + /guides chip filter
create index guide_profiles_specializations_gin
  on public.guide_profiles
  using gin (specializations);

comment on column public.guide_profiles.specializations is
  'Guide self-declared interest categories. Must match canonical IDs in src/data/interests.ts.';
