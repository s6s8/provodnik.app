-- Rollback for J0-T28 consolidated additive foundation migration.
-- Drops only what the migration added (probed-existing items are NOT touched).

begin;

drop view if exists public.platform_stats;
drop table if exists public.business_leads;
drop table if exists public.guide_testimonials;
drop table if exists public.referral_program_config;
drop table if exists public.listing_inclusions;

alter table public.help_articles drop column if exists is_published;
alter table public.notifications
  drop column if exists actor_avatar_url,
  drop column if exists amount,
  drop column if exists entity_type,
  drop column if exists entity_id;
alter table public.profiles
  drop column if exists telegram_chat_id,
  drop column if exists travel_interests,
  drop column if exists group_preference;
alter table public.destinations drop column if exists tagline;
alter table public.guide_profiles
  drop column if exists headline,
  drop column if exists contact_visibility_recalc_at;

commit;
