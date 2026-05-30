import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GuidePortfolioScreen } from "@/features/guide/components/portfolio/guide-portfolio-screen";

export const metadata: Metadata = {
  title: "Портфолио",
};

export default async function GuidePortfolioPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/guide/portfolio");
  const isGuide =
    user.app_metadata?.role === "guide" ||
    (await supabase.from("profiles").select("role").eq("id", user.id).single()).data?.role === "guide";
  if (!isGuide) redirect("/");

  return <GuidePortfolioScreen guideId={user.id} />;
}
