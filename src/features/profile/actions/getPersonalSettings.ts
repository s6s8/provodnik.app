"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getPersonalSettings(): Promise<{
  notificationPrefs: Record<string, unknown>;
  locale: string;
  preferredCurrency: string;
} | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "traveler") {
    const { data: travelerProfile } = await supabase
      .from("profiles")
      .select("notification_prefs")
      .eq("id", user.id)
      .maybeSingle();

    return {
      notificationPrefs:
        (travelerProfile?.notification_prefs as Record<string, unknown> | null) ??
        {},
      locale: "ru",
      preferredCurrency: "RUB",
    };
  }

  const { data: guideProfile } = await supabase
    .from("guide_profiles")
    .select("notification_prefs, locale, preferred_currency")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!guideProfile) return null;

  return {
    notificationPrefs:
      (guideProfile.notification_prefs as Record<string, unknown> | null) ?? {},
    locale: guideProfile.locale ?? "ru",
    preferredCurrency: guideProfile.preferred_currency ?? "RUB",
  };
}
