import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import {
  getDestinationBySlug,
  getGuidesByDestination,
  getListingsByDestination,
  type GuideRecord,
  type ListingRecord,
} from "@/data/supabase/queries";
import { DestinationDetailScreen } from "@/features/destinations/components/destination-detail-screen";
import type { DestinationSummary } from "@/data/destinations/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const getDestinationPageData = cache(async (slug: string) => {
  const supabase = await createSupabaseServerClient();
  const [destinationResult, listingsResult] = await Promise.all([
    getDestinationBySlug(supabase, slug),
    getListingsByDestination(supabase, slug),
  ]);

  const region = destinationResult.data?.region ?? null;
  const guidesResult = region
    ? await getGuidesByDestination(supabase, region)
    : { data: [] };

  return {
    destinationResult,
    listings: listingsResult.data ?? [],
    guides: guidesResult.data ?? [],
  };
});

function serializeJsonLd(jsonLd: Record<string, unknown>) {
  return JSON.stringify(jsonLd).replace(/</g, "\\u003c");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { destinationResult } = await getDestinationPageData(slug);

  if (!destinationResult.data) {
    return { title: "Направление не найдено" };
  }

  return {
    title: destinationResult.data.name,
    description: destinationResult.data.description,
  };
}

export default async function DestinationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { destinationResult, listings, guides } = await getDestinationPageData(slug);

  if (!destinationResult.data) notFound();

  const d = destinationResult.data;
  const destination: DestinationSummary = {
    slug: d.slug,
    name: d.name,
    region: d.region,
    imageUrl: d.heroImageUrl,
    description: d.description,
    listingCount: d.listingCount,
    openRequestCount: 0,
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: d.name,
    description: d.description,
    image: d.heroImageUrl ? [d.heroImageUrl] : undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: d.name,
      addressRegion: d.region,
      addressCountry: "RU",
    },
    url: `https://provodnik.app/destinations/${d.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <DestinationDetailScreen
        destination={destination}
        listings={listings as ListingRecord[]}
        guides={guides as GuideRecord[]}
      />
    </>
  );
}
