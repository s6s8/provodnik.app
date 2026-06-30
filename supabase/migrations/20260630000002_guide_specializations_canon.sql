-- 20260630000002_guide_specializations_canon.sql
-- Excel review: saving "О себе" on /guide/profile failed with
--   new row for relation "guide_profiles" violates check constraint
--   "guide_specializations_valid"
-- Root cause: the CHECK constraint still enumerated the legacy Plan-48 slug set
-- (history / architecture / photo / kids …) while the live UI vocabulary moved to
-- src/data/themes.ts (history_culture / night / active / water / religion …).
-- Selecting any current chip therefore violated the stale constraint.
--
-- This forward migration realigns the constraint with the canonical THEMES list
-- and normalises pre-existing stored slugs so no row is rejected by the new check.
-- traveler_requests.interests is intentionally untouched: it stores free-text
-- request descriptions, not theme slugs, and has no shared constraint.

-- 1. Drop the stale constraint so data cleanup + the new check can proceed.
alter table public.guide_profiles
  drop constraint if exists guide_specializations_valid;

-- 2. Normalise legacy slugs to the canonical THEMES vocabulary. Unknown/retired
--    slugs (e.g. `kids`) are dropped; empty arrays stay empty.
update public.guide_profiles gp
set specializations = coalesce(sub.arr, '{}')
from (
  select gp2.user_id,
         array_agg(distinct mapped) filter (
           where mapped in (
             'history_culture', 'nature', 'food', 'art',
             'unusual', 'night', 'active', 'water', 'religion'
           )
         ) as arr
  from public.guide_profiles gp2
  cross join lateral unnest(
    case
      when cardinality(gp2.specializations) = 0 then array['__none__']::text[]
      else gp2.specializations
    end
  ) as raw
  cross join lateral (
    select case raw
             when 'history' then 'history_culture'
             when 'architecture' then 'history_culture'
             when 'photo' then 'art'
             else raw
           end
  ) as m(mapped)
  group by gp2.user_id
) sub
where gp.user_id = sub.user_id;

-- 3. Re-add the constraint enumerating exactly the canonical THEMES slugs.
alter table public.guide_profiles
  add constraint guide_specializations_valid
  check (
    specializations <@ array[
      'history_culture', 'nature', 'food', 'art',
      'unusual', 'night', 'active', 'water', 'religion'
    ]::text[]
  );

comment on column public.guide_profiles.specializations is
  'Guide self-declared themes. Must match canonical ThemeSlug values in src/data/themes.ts.';
