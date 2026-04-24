import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GuidePortfolioScreen } from "@/features/guide/components/portfolio/guide-portfolio-screen";

export default async function GuidePortfolioPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/guide/portfolio");
  if (user.app_metadata?.role !== "guide") redirect("/");

  return <GuidePortfolioScreen guideId={user.id} />;
}
