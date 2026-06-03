"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function getRegions(data: Record<string, unknown>) {
  const regions = data.regions;
  if (!Array.isArray(regions)) return undefined;
  if (!regions.every((region): region is string => typeof region === "string")) {
    return undefined;
  }
  return regions;
}

export async function saveOnboardingStep(
  step: number,
  data: Record<string, unknown>,
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("guide_profiles")
    .select("notification_prefs")
    .eq("user_id", user.id)
    .single();

  const existing = (profile?.notification_prefs ?? {}) as Record<
    string,
    unknown
  >;
  const onboardingData = (existing._onboarding ?? {}) as Record<
    string,
    unknown
  >;
  const completedSteps = (onboardingData.completed_steps ?? []) as number[];
  const updatePayload: Record<string, unknown> = {
    notification_prefs: {
      ...existing,
      _onboarding: {
        ...onboardingData,
        [`step_${step}`]: data,
        completed_steps: [...new Set([...completedSteps, step])],
      },
    },
  };
  const regions = getRegions(data);
  if (regions) {
    updatePayload.regions = regions;
  }

  const { count, error } = await supabase
    .from("guide_profiles")
    .update(updatePayload, { count: "exact" })
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  if (count !== 1) throw new Error("Профиль гида не найден или не доступен.");

  return { success: true };
}

export async function markOnboardingComplete() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("guide_profiles")
    .select("notification_prefs")
    .eq("user_id", user.id)
    .single();

  const existing = (profile?.notification_prefs ?? {}) as Record<
    string,
    unknown
  >;

  const { count, error } = await supabase
    .from("guide_profiles")
    .update({
      notification_prefs: {
        ...existing,
        _onboarding: {
          ...((existing._onboarding as Record<string, unknown> | undefined) ??
            {}),
          completed_at: new Date().toISOString(),
        },
      },
    }, { count: "exact" })
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  if (count !== 1) throw new Error("Профиль гида не найден или не доступен.");

  return { success: true };
}
