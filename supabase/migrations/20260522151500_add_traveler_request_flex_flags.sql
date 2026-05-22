-- E-32 T1: per-parameter flexibility flags (ADDITIVE phase — production-safe).
-- Adds 4 lock booleans + date_window enum-as-text. Existing rows backfill via NOT NULL DEFAULT
-- (all locked, window = week / +-неделя). Old columns allow_guide_suggestions + date_flexibility
-- are intentionally KEPT here (the live app still writes them); they get dropped in a follow-up
-- cleanup migration AFTER the new code deploys (expand-contract pattern).
alter table public.traveler_requests
  add column if not exists date_locked boolean not null default true,
  add column if not exists time_locked boolean not null default true,
  add column if not exists count_locked boolean not null default true,
  add column if not exists budget_locked boolean not null default true,
  add column if not exists date_window text not null default 'week'
    check (date_window in ('one_day','two_days','three_days','week','two_weeks'));
