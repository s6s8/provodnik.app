import type { Metadata } from "next";

import { mapDbCategoryToThemeSlug } from "@/data/public-listings/mapper";
import type { PublicListing } from "@/data/public-listings/types";
import { getActiveListings, type ListingRecord } from "@/data/supabase/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PublicListingDiscoveryScreen } from "@/features/listings/components/public/public-listing-discovery-screen";

export function generateMetadata(): Metadata {
  return {
    title: "Экскурсии",
    description: "Авторские экскурсии от местных гидов",
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
    guideName: listing.guideName,
    guideAvatarUrl: listing.guideAvatarUrl,
    rating: listing.rating,
    reviewCount: listing.reviewCount,
  };
}

export default async function PublicListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  let listings: PublicListing[] = [];
  let loadError = false;

  try {
    const supabase = await createSupabaseServerClient();
    const result = await getActiveListings(supabase);
    if (result.error) loadError = true;
    else listings = (result.data ?? []).map((listing) => mapToPublicListing(listing));
  } catch {
    loadError = true;
  }

  // Empty catalog is handled in-page by PublicListingDiscoveryScreen's honest
  // "Маршруты не найдены → опубликуйте запрос" empty state (with a CTA into the
  // request-first flow), so /listings stays a valid target for the /tours and
  // /search redirects without exposing a dead 0-content surface (PRD-021).
  const params = await searchParams;
  const initialSearch = (params.q ?? "").trim();

  return (
    <section className="pb-20">
      {loadError ? (
        <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)] pt-[calc(var(--nav-h)+2rem)]">
          <Alert variant="destructive">
            <AlertDescription>
              Не удалось загрузить экскурсии. Попробуйте обновить страницу.
            </AlertDescription>
          </Alert>
        </div>
      ) : (
        <PublicListingDiscoveryScreen listings={listings} initialSearch={initialSearch} />
      )}
    </section>
  );
}
