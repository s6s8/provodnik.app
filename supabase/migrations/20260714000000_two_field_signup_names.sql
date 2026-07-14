-- Two-field name standard: profiles.full_name stays the private, legal-ish name;
-- guide_profiles.display_name becomes the public name the traveler sees.
--
-- Before this change the trigger copied `full_name` into `guide_profiles.display_name`,
-- so the only name a user ever gave was simultaneously their private and their public
-- identity. Signup now sends `user_metadata.display_name` (guides fill it themselves;
-- travelers default to the first word of their full name — never the email local-part,
-- which is the leak this split exists to prevent). `full_name` remains the fallback for
-- accounts created before this migration and for any auth user created outside signUpAction.
--
-- ROLLBACK (previous function body, verbatim from
-- supabase/migrations/20260702000000_current_schema_baseline.sql):
--
-- CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
--     LANGUAGE "plpgsql" SECURITY DEFINER
--     SET "search_path" TO 'public'
--     AS $$
-- declare
--   v_role       public.app_role;
--   v_full_name  text;
--   v_guide_type text;
-- begin
--   v_role := case new.raw_user_meta_data->>'role'
--     when 'guide' then 'guide'::public.app_role
--     else 'traveler'::public.app_role
--   end;
--   v_full_name := coalesce(new.raw_user_meta_data->>'full_name', '');
--
--   insert into public.profiles (id, role, email, full_name)
--   values (new.id, v_role, new.email, v_full_name)
--   on conflict (id) do nothing;
--
--   if v_role = 'guide'::public.app_role then
--     v_guide_type := case
--       when new.raw_user_meta_data->>'guide_type'
--            in ('individual_guide', 'agency_representative', 'guide_team')
--         then new.raw_user_meta_data->>'guide_type'
--       else null
--     end;
--
--     insert into public.guide_profiles (user_id, display_name, specialization, guide_type)
--     values (
--       new.id,
--       v_full_name,
--       coalesce(new.raw_user_meta_data->>'specialization', ''),
--       v_guide_type
--     )
--     on conflict (user_id) do nothing;
--   end if;
--
--   return new;
-- end;
-- $$;

CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_role         public.app_role;
  v_full_name    text;
  v_display_name text;
  v_guide_type   text;
begin
  v_role := case new.raw_user_meta_data->>'role'
    when 'guide' then 'guide'::public.app_role
    else 'traveler'::public.app_role
  end;
  v_full_name := coalesce(new.raw_user_meta_data->>'full_name', '');
  v_display_name := coalesce(
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'full_name',
    ''
  );

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
      v_display_name,
      coalesce(new.raw_user_meta_data->>'specialization', ''),
      v_guide_type
    )
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";
