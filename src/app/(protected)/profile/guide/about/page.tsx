import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GuideAboutForm } from "./guide-about-form";

export const metadata: Metadata = {
  title: "О себе — Профиль гида",
};

export default async function GuideAboutPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) redirect("/auth?next=/profile/guide/about");

  const { data: profile } = await supabase
    .from("guide_profiles")
    .select("bio, languages, years_experience, regions")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">О себе</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Эта информация отображается на вашей публичной странице.
        </p>
      </div>

      <GuideAboutForm
        initialBio={profile?.bio ?? ""}
        initialLanguages={profile?.languages ?? []}
        initialYearsExperience={profile?.years_experience ?? null}
      />
    </div>
  );
}
