"use server";

import type { ThemeSlug } from "@/data/themes";
import { THEMES } from "@/data/themes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const canonThemeSlugs = new Set<string>(THEMES.map((t) => t.slug));

export type GuideProfileUpdatePayload = {
  bio: string;
  languages: string[];
  specializations: ThemeSlug[];
  years_experience?: number;
};

export type SaveAboutResult = { ok: true } | { ok: false; error: string };

export async function saveGuideAboutAction(formData: FormData): Promise<SaveAboutResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Требуется вход" };

  const bio = formData.get("bio") as string | null;
  const yearsExperience = formData.get("years_experience");
  const languagesRaw = formData.getAll("languages") as string[];
  const specializationsRaw = formData.getAll("specializations") as string[];

  const specializations = specializationsRaw.filter((s): s is ThemeSlug =>
    canonThemeSlugs.has(s)
  );

  const update: GuideProfileUpdatePayload = {
    bio: bio ?? "",
    languages: languagesRaw.filter(Boolean),
    specializations,
  };

  if (yearsExperience && !isNaN(Number(yearsExperience))) {
    update.years_experience = Number(yearsExperience);
  }

  const { error } = await supabase
    .from("guide_profiles")
    .update(update)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
