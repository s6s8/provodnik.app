"use server";

import { revalidatePath } from "next/cache";

import type { ThemeSlug } from "@/data/themes";
import { THEMES } from "@/data/themes";
import { isGuideProfileConfirmed } from "@/lib/profile/guide-verification";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const canonThemeSlugs = new Set<string>(THEMES.map((t) => t.slug));

export type GuideProfileUpdatePayload = {
  bio: string;
  base_city: string;
  languages: string[];
  specializations: ThemeSlug[];
  years_experience?: number;
  regions?: string[];
};

export type SaveAboutResult =
  | { ok: true; regions: string[] }
  | { ok: false; error: string };

export async function saveGuideAboutAction(formData: FormData): Promise<SaveAboutResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Требуется вход" };

  const { data: statusRow } = await supabase
    .from("guide_profiles")
    .select("verification_status, regions")
    .eq("user_id", user.id)
    .maybeSingle();

  const bio = formData.get("bio") as string | null;
  if (isGuideProfileConfirmed(statusRow?.verification_status)) {
    const { error } = await supabase
      .from("guide_profiles")
      .update({ bio: bio ?? "" })
      .eq("user_id", user.id);

    if (error) return { ok: false, error: error.message };
    revalidatePath("/guide/profile");
    return { ok: true, regions: statusRow?.regions ?? [] };
  }

  const baseCityRaw = formData.get("base_city");
  const yearsExperience = formData.get("years_experience");
  const languagesRaw = formData.getAll("languages") as string[];
  const specializationsRaw = formData.getAll("specializations") as string[];
  const regionsRaw = formData.getAll("regions") as string[];
  const baseCity = typeof baseCityRaw === "string" ? baseCityRaw.trim() : "";

  if (baseCity === "") {
    return { ok: false, error: "Укажите базовый город" };
  }

  const specializations = specializationsRaw.filter((s): s is ThemeSlug =>
    canonThemeSlugs.has(s)
  );

  const regions = regionsRaw.filter(Boolean);

  const update: GuideProfileUpdatePayload = {
    bio: bio ?? "",
    base_city: baseCity,
    languages: languagesRaw.filter(Boolean),
    specializations,
    regions,
  };

  if (yearsExperience && !isNaN(Number(yearsExperience))) {
    update.years_experience = Number(yearsExperience);
  }

  const { data: updatedRow, error } = await supabase
    .from("guide_profiles")
    .update(update)
    .eq("user_id", user.id)
    .select("user_id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };

  if (!updatedRow) {
    const { data: insertedRow, error: insertError } = await supabase
      .from("guide_profiles")
      .insert({ user_id: user.id, ...update })
      .select("user_id")
      .maybeSingle();

    if (insertError || !insertedRow) {
      return {
        ok: false,
        error: insertError?.message ?? "Не удалось сохранить профиль гида.",
      };
    }
  }

  revalidatePath("/guide/profile");
  return { ok: true, regions };
}
