-- 20260630000001_profiles_phone_unique.sql
-- Excel review: a phone already attached to one account could be reused to
-- create another. Enforce phone uniqueness at the database level (the security
-- and integrity boundary), not only in the signup UI.
--
-- Strategy: a STORED generated column normalises `phone` to digits only
-- (matching the JS `phone.replace(/\D/g, "")` used by signUpAction), then a
-- PARTIAL UNIQUE INDEX guarantees no two profiles share the same normalised
-- number. NULL/blank phones normalise to NULL and are excluded from the index,
-- so phone stays optional and shared-blank values never collide.

alter table public.profiles
  add column if not exists phone_normalized text
  generated always as (
    nullif(regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g'), '')
  ) stored;

create unique index if not exists profiles_phone_normalized_key
  on public.profiles (phone_normalized)
  where phone_normalized is not null;

comment on column public.profiles.phone_normalized is
  'Digits-only normalisation of phone for uniqueness enforcement. Generated; do not write directly. Mirrors signUpAction normalisation.';
