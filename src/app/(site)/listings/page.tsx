import type { Metadata } from "next";

import type { PublicListing } from "@/data/public-listings/types";
import { getActiveListings, type ListingRecord } from "@/data/supabase/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PublicListingDiscoveryScreen } from "@/features/listings/components/public/public-listing-discovery-screen";

export function generateMetadata(): Metadata {
  return {
    title: "Готовые туры",
    description: "Экскурсии и туры от проверенных гидов",
  };
}

function mapToPublicListing(listing: ListingRecord): PublicListing {
  return {
    slug: listing.slug,
    title: listing.title,
    city: listing.destinationName,
    region: listing.destinationRegion,
    coverImageUrl: listing.imageUrl,
    durationDays: Math.min(3, Math.max(1, listing.durationDays)) as PublicListing["durationDays"],
    priceFromRub: listing.priceRub,
    groupSizeMax: listing.groupSize,
    themes: [listing.format as PublicListing["themes"][number]],
    highlights: listing.description ? [listing.description] : [listing.title],
    itinerary: [
      {
        title: listing.title,
        description: listing.description || listing.destinationRegion,
        durationHours: Math.max(1, listing.durationDays * 6),
      },
    ],
    inclusions: listing.inclusions as PublicListing["inclusions"],
    guideSlug: listing.guideSlug,
  };
}

export default async function PublicListingsPage() {
  let listings: PublicListing[] = [];

  const supabase = await createSupabaseServerClient();
  const result = await getActiveListings(supabase);
  if (result.data && result.data.length > 0) {
    listings = result.data.map((listing) => mapToPublicListing(listing));
  }

  return (
    <section className="pt-[110px] pb-20">
      <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
        <PublicListingDiscoveryScreen listings={listings} />
      </div>
    </section>
  );
}
