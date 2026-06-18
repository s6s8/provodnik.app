-- Append guide-card display fields to the RLS-safe public profile view so the
-- redesigned traveler request-detail page can render pixel-faithful guide cards.
--
-- avatar_url comes from profiles (this view already exposes cross-user full_name).
-- years_experience is a user-entered guide_profiles column (edited in /guide/profile).
-- trips_completed / recommend_pct are DERIVED (not user-entered) from real bookings/reviews.
--
-- CREATE OR REPLACE VIEW only appends columns at the end, so existing consumers and
-- the search_guides RPC (which selects guide_profiles.*) are untouched — no rowtype drift.

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
  gp.preferred_currency,
  -- appended for the guide card:
  p.avatar_url,
  gp.years_experience,
  (
    select count(*)
    from public.bookings b
    where b.guide_id = gp.user_id
      and b.status = 'completed'
  ) as trips_completed,
  (
    select round(100.0 * count(*) filter (where r.rating >= 4) / nullif(count(*), 0))
    from public.reviews r
    where r.guide_id = gp.user_id
      and r.status = 'published'
  ) as recommend_pct
from public.guide_profiles gp
left join public.profiles p on p.id = gp.user_id
where gp.verification_status = 'approved';

grant select on public.v_guide_public_profile to anon, authenticated;
