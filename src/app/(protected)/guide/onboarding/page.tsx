import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { OnboardingWizard } from "@/features/guide/components/onboarding/OnboardingWizard";
import { flags } from "@/lib/flags";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Онбординг гида",
};

export default async function GuideOnboardingPage() {
  if (!flags.FEATURE_TRIPSTER_QUIZ) notFound();

  if (hasSupabaseEnv()) {
    try {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("guide_profiles")
          .select("notification_prefs")
          .eq("user_id", user.id)
          .maybeSingle();

        const prefs = profile?.notification_prefs as
          | Record<string, unknown>
          | undefined;
        const onboarding = prefs?._onboarding as
          | Record<string, unknown>
          | undefined;
        const completedAt = onboarding?.completed_at;
        if (
          typeof completedAt === "string" &&
          completedAt.length > 0
        ) {
          redirect("/guide/dashboard");
        }
      }
    } catch {
      // Shell without working Supabase: still render wizard
    }
  }

  return (
    <div className="container flex min-h-[60vh] flex-col justify-center py-8">
      <OnboardingWizard initialStep={1} />
    </div>
  );
}
