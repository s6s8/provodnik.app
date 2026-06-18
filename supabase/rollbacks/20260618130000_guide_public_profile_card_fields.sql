-- Rollback: restore v_guide_public_profile to its prior 14-column definition
-- (verbatim from 20260528154254_drop_guide_display_name.sql). Drops the appended
-- avatar_url / years_experience / trips_completed / recommend_pct columns.
-- CREATE OR REPLACE cannot drop trailing columns, so drop + recreate.

drop view if exists public.v_guide_public_profile;

create or replace view public.v_guide_public_profile as
select
  gp.user_id,
  gp.slug,
  p.full_name,
  gp.bio,
  gp.regions,
  gp.languages,
  gp.specialties,
  gp.average_rating,
  gp.review_count,
  gp.response_rate,
  gp.contact_visibility_unlocked,
  gp.is_available,
  gp.locale,
  gp.preferred_currency
from public.guide_profiles gp
left join public.profiles p on p.id = gp.user_id
where gp.verification_status = 'approved';

grant select on public.v_guide_public_profile to anon, authenticated;
