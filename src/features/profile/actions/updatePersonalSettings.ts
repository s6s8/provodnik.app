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
    if (data.locale !== "ru" || data.preferredCurrency !== "RUB") {
      return {
        success: false,
        error: "Настройки языка и валюты доступны только профилям гида.",
      };
    }

    const { count, error } = await supabase
      .from("profiles")
      .update({
        notification_prefs: data.notificationPrefs,
      }, { count: "exact" })
      .eq("id", user.id);

    if (error) throw new Error(error.message);
    if (count !== 1) throw new Error("Профиль не найден или не доступен.");
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

  const { count, error } = await supabase
    .from("guide_profiles")
    .update({
      locale: data.locale,
      preferred_currency: data.preferredCurrency,
      notification_prefs: data.notificationPrefs,
    }, { count: "exact" })
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  if (count !== 1) throw new Error("Профиль гида не найден или не доступен.");
  return { success: true };
}
