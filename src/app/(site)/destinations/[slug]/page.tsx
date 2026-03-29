import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { seededDestinations } from "@/data/destinations/seed";
import { seededPublicListings } from "@/data/public-listings/seed";
import {
  getDestinationBySlug,
  getListingsByDestination,
  type ListingRecord,
} from "@/data/supabase/queries";
import { DestinationDetailScreen } from "@/features/destinations/components/destination-detail-screen";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Направление",
  description: "Откройте город: экскурсии, группы путешественников и локальные гиды.",
};

const fallbackImage =
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&q=80";

function mapSeededListings(slug: string): ListingRecord[] {
  return seededPublicListings
    .filter((listing) => listing.city === seededDestinations.find((item) => item.slug === slug)?.name)
    .map((listing) => ({
      id: listing.slug,
      slug: listing.slug,
      title: listing.title,
      destinationSlug: slug,
      destinationName: listing.city,
      destinationRegion: listing.region,
      imageUrl: listing.coverImageUrl ?? fallbackImage,
      priceRub: listing.priceFromRub,
      durationDays: listing.durationDays,
      durationLabel: `${listing.durationDays} дн.`,
      groupSize: listing.groupSizeMax,
      difficulty: "Средняя",
      departure: listing.city,
      format: listing.themes[0] ?? "Маршрут",
      description: listing.highlights.join(". "),
      inclusions: [...listing.inclusions],
      exclusions: [],
      guideSlug: listing.guideSlug,
      guideName: "Локальный гид",
      guideHomeBase: listing.city,
      rating: 4.8,
      reviewCount: 0,
      status: "active",
    }));
}

export default async function DestinationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let destination = seededDestinations.find((item) => item.slug === slug) ?? null;
  let listings = mapSeededListings(slug);

  try {
    const client = await createSupabaseServerClient();
    const destinationResult = await getDestinationBySlug(client, slug);
    const listingsResult = await getListingsByDestination(client, slug);

    if (destinationResult.data) {
      destination = {
        slug: destinationResult.data.slug,
        name: destinationResult.data.name,
        region: destinationResult.data.region,
        imageUrl: destinationResult.data.heroImageUrl,
        description: destinationResult.data.description,
        listingCount: destinationResult.data.listingCount,
        openRequestCount: destinationResult.data.guidesCount,
      };
    }

    if (listingsResult.data?.length) {
      listings = listingsResult.data;
    }
  } catch {}

  if (!destination) {
    notFound();
  }

  return (
    <DestinationDetailScreen
      destination={destination}
      listings={listings}
    />
  );
}
