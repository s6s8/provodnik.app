import type { Metadata } from "next";

import { getActiveGuideDestinations, getHomepageRequests, type DestinationOption, type RequestRecord } from "@/data/supabase/queries";
import { HomePageShell2 } from "@/features/homepage/components/homepage-shell2";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Проводник",
};

export default async function HomePage() {
  let destinations: DestinationOption[] = [];
  let requests: RequestRecord[] = [];
  try {
    const supabase = await createSupabaseServerClient();
    const [destResult, reqResult] = await Promise.all([
      getActiveGuideDestinations(supabase),
      getHomepageRequests(supabase),
    ]);
    destinations = destResult.data ?? [];
    requests = reqResult.data ?? [];
  } catch {
    // both stay []
  }
  return <HomePageShell2 destinations={destinations} requests={requests} />;
}
