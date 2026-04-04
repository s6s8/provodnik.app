alter table public.guide_profiles
  add column if not exists specialization text,
  add column if not exists rating numeric(2,1) not null default 0.0,
  add column if not exists completed_tours integer not null default 0,
  add column if not exists is_available boolean not null default false;

update public.guide_profiles
set specialization = coalesce(specialization, specialties[1])
where specialization is null
  and coalesce(array_length(specialties, 1), 0) > 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'guide_profiles_rating_check'
  ) then
    alter table public.guide_profiles
      add constraint guide_profiles_rating_check
      check (rating >= 0 and rating <= 5);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'guide_profiles_completed_tours_check'
  ) then
    alter table public.guide_profiles
      add constraint guide_profiles_completed_tours_check
      check (completed_tours >= 0);
  end if;
end $$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  role_text text;
  desired_role public.app_role;
  derived_name text;
  guide_specialization text;
begin
  role_text := coalesce(new.raw_user_meta_data ->> 'role', 'traveler');
  desired_role := case
    when role_text = 'guide' then 'guide'::public.app_role
    when role_text = 'admin' then 'admin'::public.app_role
    else 'traveler'::public.app_role
  end;

  derived_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'user'
  );

  guide_specialization := nullif(new.raw_user_meta_data ->> 'specialization', '');

  insert into public.profiles (id, role, email, full_name, avatar_url)
  values (
    new.id,
    desired_role,
    new.email,
    derived_name,
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do update
    set role = excluded.role,
        email = excluded.email,
        full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
        avatar_url = coalesce(nullif(public.profiles.avatar_url, ''), excluded.avatar_url),
        updated_at = timezone('utc', now());

  if desired_role = 'guide' then
    insert into public.guide_profiles (
      user_id,
      display_name,
      specialization,
      specialties,
      regions,
      languages,
      rating,
      completed_tours,
      is_available
    )
    values (
      new.id,
      derived_name,
      guide_specialization,
      case
        when guide_specialization is null then '{}'::text[]
        else array[guide_specialization]
      end,
      '{}'::text[],
      '{}'::text[],
      0.0,
      0,
      false
    )
    on conflict (user_id) do update
      set display_name = coalesce(nullif(public.guide_profiles.display_name, ''), excluded.display_name),
          specialization = coalesce(nullif(public.guide_profiles.specialization, ''), excluded.specialization),
          specialties = case
            when coalesce(array_length(public.guide_profiles.specialties, 1), 0) = 0
              then excluded.specialties
            else public.guide_profiles.specialties
          end,
          regions = coalesce(public.guide_profiles.regions, '{}'::text[]),
          languages = coalesce(public.guide_profiles.languages, '{}'::text[]),
          rating = coalesce(public.guide_profiles.rating, 0.0),
          completed_tours = coalesce(public.guide_profiles.completed_tours, 0),
          is_available = coalesce(public.guide_profiles.is_available, false),
          updated_at = timezone('utc', now());
  end if;

  return new;
end;
$$;
