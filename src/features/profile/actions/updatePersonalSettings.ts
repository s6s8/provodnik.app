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

  await supabase
    .from("guide_profiles")
    .update({
      locale: data.locale,
      preferred_currency: data.preferredCurrency,
      notification_prefs: data.notificationPrefs,
    })
    .eq("user_id", user.id);

  return { success: true };
}
