import type { TravelerProfile } from "@/features/profile/components/traveler-profile-form";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const EXTENDED_PROFILE_SELECT =
  "avatar_url, full_name, bio, home_city, languages, birth_year";
const BASIC_PROFILE_SELECT = "avatar_url, full_name";

type ProfileRow = {
  avatar_url?: string | null;
  full_name?: string | null;
  bio?: string | null;
  home_city?: string | null;
  languages?: string[] | null;
  birth_year?: number | null;
};

function mapProfileRow(row: ProfileRow): TravelerProfile {
  const fullName = row.full_name?.trim();
  return {
    full_name: fullName || null,
    avatar_url: row.avatar_url ?? null,
    bio: row.bio ?? null,
    home_city: row.home_city ?? null,
    languages: row.languages?.length ? row.languages : null,
    birth_year: row.birth_year ?? null,
  };
}

export async function loadTravelerProfileFromSupabase(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<TravelerProfile | null> {
  const { data: extended, error: extendedError } = await supabase
    .from("profiles")
    .select(EXTENDED_PROFILE_SELECT)
    .eq("id", userId)
    .maybeSingle();

  if (!extendedError && extended) {
    return mapProfileRow(extended as ProfileRow);
  }

  const { data: basic, error: basicError } = await supabase
    .from("profiles")
    .select(BASIC_PROFILE_SELECT)
    .eq("id", userId)
    .maybeSingle();

  if (!basicError && basic) {
    return mapProfileRow(basic as ProfileRow);
  }

  return null;
}
