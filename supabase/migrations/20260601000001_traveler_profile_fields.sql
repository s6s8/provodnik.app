alter table public.profiles
  add column if not exists bio        text,
  add column if not exists home_city  text,
  add column if not exists languages  text[] not null default '{}',
  add column if not exists birth_year integer check (birth_year >= 1900 and birth_year <= 2100);
