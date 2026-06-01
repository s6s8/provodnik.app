"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findContactInBio } from "@/features/profile/validation/anti-contact";

export async function updateTravelerProfile(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const bio = formData.get("bio")?.toString() ?? "";
  const contact = findContactInBio(bio);
  if (contact) {
    return {
      ok: false,
      error: `Контактные данные в «О себе» запрещены (${contact.kind}).`,
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Требуется вход" };

  const fullName = formData.get("name")?.toString().trim() ?? "";
  const homeCity = formData.get("homeCity")?.toString().trim() ?? "";
  const languages = (formData.getAll("languages") as string[]).filter(Boolean);
  const birthYearRaw = formData.get("birthYear")?.toString();
  const birthYear =
    birthYearRaw && !isNaN(Number(birthYearRaw)) ? Number(birthYearRaw) : null;

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName || null,
      bio: bio || null,
      home_city: homeCity || null,
      languages,
      birth_year: birthYear,
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/profile/personal");
  return { ok: true };
}
