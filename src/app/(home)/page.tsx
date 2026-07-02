import type { Metadata } from "next";

import { getActiveGuideDestinations, getHomepageRequests, type DestinationOption, type RequestRecord } from "@/data/supabase/queries";
import { SiteHeaderServer } from "@/components/shared/site-header-server";
import { HomePageShell2Classic } from "@/features/homepage-classic/components/homepage-shell2-classic";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Проводник — местные гиды по вашему запросу",
  description:
    "Опишите поездку — подберём проверенного местного гида. Заявки, направления и живые отклики.",
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
    // all stay empty
  }

  return (
    <>
      <SiteHeaderServer />
      <main>
        <HomePageShell2Classic destinations={destinations} requests={requests} />
      </main>
    </>
  );
}
