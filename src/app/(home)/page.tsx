import type { Metadata } from "next";

import { getActiveGuideDestinations, getDestinations, getHomepageRequests, type DestinationOption, type RequestRecord } from "@/data/supabase/queries";
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
  // Maps a destination name to its catalog slug so popular-destination tiles can
  // deep-link to the rich /destinations/[slug] page instead of a listings search.
  let destinationSlugs: Record<string, string> = {};
  try {
    const supabase = await createSupabaseServerClient();
    const [destResult, reqResult, catalogResult] = await Promise.all([
      getActiveGuideDestinations(supabase),
      getHomepageRequests(supabase),
      getDestinations(supabase),
    ]);
    destinations = destResult.data ?? [];
    requests = reqResult.data ?? [];
    destinationSlugs = Object.fromEntries(
      (catalogResult.data ?? []).map((d) => [d.name.trim().toLowerCase(), d.slug]),
    );
  } catch {
    // all stay empty
  }

  return (
    <>
      <SiteHeaderServer />
      <main>
        <HomePageShell2Classic
          destinations={destinations}
          requests={requests}
          destinationSlugs={destinationSlugs}
        />
      </main>
    </>
  );
}
