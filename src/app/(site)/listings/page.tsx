import type { Metadata } from "next";

import { mapDbCategoryToThemeSlug } from "@/data/public-listings/mapper";
import type { PublicListing } from "@/data/public-listings/types";
import { getActiveListings, type ListingRecord } from "@/data/supabase/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PublicListingDiscoveryScreen } from "@/features/listings/components/public/public-listing-discovery-screen";

export function generateMetadata(): Metadata {
  return {
    title: "Готовые экскурсии",
    description: "Готовые экскурсии от местных гидов",
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
    themes: (() => {
      const slug = mapDbCategoryToThemeSlug(listing.format);
      return slug != null ? ([slug] as const) : [];
    })(),
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

export default async function PublicListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  let listings: PublicListing[] = [];

  try {
    const supabase = await createSupabaseServerClient();
    const result = await getActiveListings(supabase);
    if (result.data && result.data.length > 0) {
      listings = result.data.map((listing) => mapToPublicListing(listing));
    }
  } catch {
    // listings stays []
  }

  const params = await searchParams;
  const initialSearch = (params.q ?? "").trim();

  return (
    <section className="pt-[110px] pb-20">
      <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
        <PublicListingDiscoveryScreen listings={listings} initialSearch={initialSearch} />
      </div>
    </section>
  );
}
