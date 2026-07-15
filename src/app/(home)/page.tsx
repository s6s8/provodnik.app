import type { Metadata } from "next";

import { getActiveGuideDestinations, getDestinationSuggestions, getGuideBySlug, getHomepageRequests, type DestinationOption, type RequestRecord } from "@/data/supabase/queries";
import { SiteHeaderServer } from "@/components/shared/site-header-server";
import { HomePageShell2Classic } from "@/features/homepage-classic/components/homepage-shell2-classic";
import { flags } from "@/lib/flags";
import { getHomepageInventory, type HomepageInventory } from "@/lib/supabase/homepage";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Проводник — местные гиды по вашему запросу",
  description:
    "Опишите поездку — подберём проверенного местного гида. Заявки, направления и живые отклики.",
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ guide?: string }>;
}) {
  let destinations: DestinationOption[] = [];
  let searchDestinations: DestinationOption[] = [];
  let requests: RequestRecord[] = [];
  let viewerId: string | null = null;
  let preferredGuide: { slug: string; name: string } | null = null;
  let inventory: HomepageInventory = { listings: [], guides: [], reviews: [] };
  const joinedRequestIds = new Set<string>();
  const { guide: guideParam } = await searchParams;
  try {
    const supabase = await createSupabaseServerClient();
    const [destResult, searchDestResult, reqResult, userResult, guideResult, inventoryResult] = await Promise.all([
      getActiveGuideDestinations(supabase),
      getDestinationSuggestions(supabase),
      getHomepageRequests(supabase),
      supabase.auth.getUser().catch(() => ({ data: { user: null } })),
      guideParam ? getGuideBySlug(supabase, guideParam) : Promise.resolve(null),
      getHomepageInventory(supabase),
    ]);
    destinations = destResult.data ?? [];
    searchDestinations = searchDestResult.data ?? [];
    requests = reqResult.data ?? [];
    viewerId = userResult.data.user?.id ?? null;
    inventory = inventoryResult.data ?? inventory;
    if (guideResult?.data) {
      preferredGuide = { slug: guideResult.data.slug, name: guideResult.data.fullName };
    }
    if (viewerId && requests.length > 0) {
      const { data: memberships } = await supabase
        .from("open_request_members")
        .select("request_id")
        .eq("traveler_id", viewerId)
        .eq("status", "joined")
        .is("left_at", null)
        .in("request_id", requests.map((request) => request.id));
      for (const membership of memberships ?? []) {
        if (membership.request_id) joinedRequestIds.add(membership.request_id as string);
      }
    }
  } catch {
    // all stay empty
  }

  return (
    <>
      <SiteHeaderServer />
      <main>
        <HomePageShell2Classic
          destinations={destinations}
          searchDestinations={searchDestinations}
          requests={requests}
          viewerId={viewerId}
          preferredGuide={preferredGuide}
          joinedRequestIds={joinedRequestIds}
          // The excursions block links into /listings, which redirects to /guides
          // while FEATURE_PUBLIC_CATALOG is off — no catalog, no block.
          listings={flags.FEATURE_PUBLIC_CATALOG ? inventory.listings : []}
          guides={inventory.guides}
          reviews={inventory.reviews}
        />
      </main>
    </>
  );
}
