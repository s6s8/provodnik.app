import type { Metadata } from "next";

import {
  getActiveGuideDestinations,
  getHomepageRequests,
} from "@/data/supabase/queries";
import { HomePageShell2 } from "@/features/homepage/components/homepage-shell2";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Проводник — Найди своего гида",
};

export default async function HomePage2() {
  const supabase = await createSupabaseServerClient();
  const [destResult, reqResult] = await Promise.all([
    getActiveGuideDestinations(supabase),
    getHomepageRequests(supabase),
  ]);

  return (
    <HomePageShell2
      destinations={destResult.data ?? []}
      requests={reqResult.data ?? []}
    />
  );
}
