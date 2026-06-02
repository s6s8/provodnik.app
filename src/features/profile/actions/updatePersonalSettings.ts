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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "traveler") {
    const { error } = await supabase
      .from("profiles")
      .update({
        notification_prefs: data.notificationPrefs,
      })
      .eq("id", user.id);

    if (error) throw new Error(error.message);
    return { success: true };
  }

  const { data: existingGuideProfile } = await supabase
    .from("guide_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existingGuideProfile) {
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
