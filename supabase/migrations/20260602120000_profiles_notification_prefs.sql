-- Traveler notification matrix prefs (guide prefs stay on guide_profiles).
alter table public.profiles
  add column if not exists notification_prefs jsonb not null default '{}'::jsonb;
