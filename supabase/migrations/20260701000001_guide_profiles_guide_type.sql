-- 20260701000001_guide_profiles_guide_type.sql
-- Durable guide type. Signup already captures the guide's kind into
-- auth user_metadata (individual_guide / agency_representative / guide_team),
-- but it was never persisted to a table, so profile and admin surfaces could
-- not display it. This migration:
--   1. adds an additive, nullable `guide_type` column (backward-compatible for
--      every existing row) with a CHECK constraint on the canonical id set;
--   2. teaches handle_new_user() to persist guide_type from raw_user_meta_data
--      at signup, defensively ignoring any value outside the allowed set so a
--      malformed metadata value can never break registration.

alter table public.guide_profiles
  add column if not exists guide_type text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'guide_profiles_guide_type_valid'
  ) then
    alter table public.guide_profiles
      add constraint guide_profiles_guide_type_valid
      check (
        guide_type is null
        or guide_type in ('individual_guide', 'agency_representative', 'guide_team')
      );
  end if;
end $$;

comment on column public.guide_profiles.guide_type is
  'Kind of guide chosen at signup: individual_guide | agency_representative | guide_team. Nullable for pre-existing rows.';

create or replace function public.handle_new_user()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_role       public.app_role;
  v_full_name  text;
  v_guide_type text;
begin
  v_role := case new.raw_user_meta_data->>'role'
    when 'guide' then 'guide'::public.app_role
    else 'traveler'::public.app_role
  end;
  v_full_name := coalesce(new.raw_user_meta_data->>'full_name', '');

  insert into public.profiles (id, role, email, full_name)
  values (new.id, v_role, new.email, v_full_name)
  on conflict (id) do nothing;

  if v_role = 'guide'::public.app_role then
    v_guide_type := case
      when new.raw_user_meta_data->>'guide_type'
           in ('individual_guide', 'agency_representative', 'guide_team')
        then new.raw_user_meta_data->>'guide_type'
      else null
    end;

    insert into public.guide_profiles (user_id, display_name, specialization, guide_type)
    values (
      new.id,
      v_full_name,
      coalesce(new.raw_user_meta_data->>'specialization', ''),
      v_guide_type
    )
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$function$;
