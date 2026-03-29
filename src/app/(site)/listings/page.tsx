import type { Metadata } from "next";

import type {
  PublicListing,
  PublicListingInclusion,
  PublicListingTheme,
} from "@/data/public-listings/types";
import { getActiveListings, type ListingRecord } from "@/data/supabase/queries";
import { PublicListingDiscoveryScreen } from "@/features/listings/components/public/public-listing-discovery-screen";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Экскурсии",
  description: "Готовые маршруты и экскурсии по России от проверенных гидов.",
};

const allowedThemes = new Set<PublicListingTheme>([
  "Еда",
  "История",
  "Природа",
  "Фотография",
  "С семьей",
  "Несезон",
]);

const allowedInclusions = new Set<PublicListingInclusion>([
  "Работа гида",
  "Локальный транспорт",
  "Билеты в музеи",
  "Чай и перекус",
  "Снаряжение",
]);

function mapTheme(value: string): PublicListingTheme {
  return allowedThemes.has(value as PublicListingTheme)
    ? (value as PublicListingTheme)
    : "История";
}

function mapInclusions(values: readonly string[]): PublicListingInclusion[] {
  const mapped = values.filter((value): value is PublicListingInclusion =>
    allowedInclusions.has(value as PublicListingInclusion),
  );

  return mapped.length > 0 ? mapped : ["Работа гида"];
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
    themes: [mapTheme(listing.format)],
    highlights: listing.description ? [listing.description] : [listing.title],
    itinerary: [
      {
        title: listing.title,
        description: listing.description || listing.destinationRegion,
        durationHours: Math.max(1, listing.durationDays * 6),
      },
    ],
    inclusions: mapInclusions(listing.inclusions),
    guideSlug: listing.guideSlug,
  };
}

export default async function PublicListingsPage() {
  let listings: PublicListing[] = [];

  try {
    const client = await createSupabaseServerClient();
    const result = await getActiveListings(client);

    if (result.data && result.data.length > 0) {
      listings = result.data.map((listing) => mapToPublicListing(listing));
    }
  } catch {}

  return <PublicListingDiscoveryScreen listings={listings} />;
}
