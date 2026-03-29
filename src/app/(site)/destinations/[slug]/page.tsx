import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getDestinationBySlug,
  getListingsByDestination,
  type ListingRecord,
} from "@/data/supabase/queries";
import { DestinationDetailScreen } from "@/features/destinations/components/destination-detail-screen";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DestinationSummary } from "@/data/destinations/types";

export const metadata: Metadata = {
  title: "Направление",
  description: "Откройте город: экскурсии, группы путешественников и локальные гиды.",
};

export default async function DestinationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const client = await createSupabaseServerClient();

  const destinationResult = await getDestinationBySlug(client, slug);
  const listingsResult = await getListingsByDestination(client, slug);

  if (!destinationResult.data) notFound();

  const d = destinationResult.data;
  const destination: DestinationSummary = {
    slug: d.slug,
    name: d.name,
    region: d.region,
    imageUrl: d.heroImageUrl,
    description: d.description,
    listingCount: d.listingCount,
    openRequestCount: d.guidesCount,
  };

  const listings: ListingRecord[] = listingsResult.data ?? [];

  return (
    <DestinationDetailScreen
      destination={destination}
      listings={listings}
    />
  );
}
