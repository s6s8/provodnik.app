"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function updatePersonalSettings(data: {
  locale: string;
  preferredCurrency: string;
  notificationPrefs: Record<string, unknown>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Verify guide profile exists before updating
  const { data: existingProfile } = await supabase
    .from("guide_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existingProfile) {
    return { success: false, error: "Профиль гида не найден." };
  }

  const { error } = await supabase
    .from("guide_profiles")
    .update({
      locale: data.locale,
      preferred_currency: data.preferredCurrency,
      notification_prefs: data.notificationPrefs,
    })
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  return { success: true };
}
