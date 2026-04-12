"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  const { error } = await supabase
    .from("guide_profiles")
    .update({
      notification_prefs: {
        ...existing,
        _onboarding: {
          ...onboardingData,
          [`step_${step}`]: data,
          completed_steps: [...new Set([...completedSteps, step])],
        },
      },
    })
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

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

  const { error } = await supabase
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
    })
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  return { success: true };
}
