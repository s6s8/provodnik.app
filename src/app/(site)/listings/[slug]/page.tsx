import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { getListingBySlug, getGuideBySlug, getListingReviews } from "@/data/supabase/queries";
import type { PublicListing, PublicListingInclusion } from "@/data/public-listings/types";
import { ListingDetailScreen } from "@/features/listings/components/public/listing-detail-screen";

const getListingPageData = cache(async (slug: string) => {
  const listingResult = await getListingBySlug(null as any, slug);
  if (!listingResult.data) {
    return {
      listingResult,
      guideResult: { data: null, error: null },
      reviewRecords: [],
    };
  }

  const [guideResult, reviewsResult] = await Promise.all([
    getGuideBySlug(null as any, listingResult.data.guideSlug),
    getListingReviews(null as any, slug),
  ]);

  return {
    listingResult,
    guideResult,
    reviewRecords: reviewsResult.data ?? [],
  };
});

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function serializeJsonLd(jsonLd: Record<string, unknown>) {
  return JSON.stringify(jsonLd).replace(/</g, "\\u003c");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { listingResult } = await getListingPageData(slug);

  if (!listingResult.data) {
    return { title: "Экскурсия не найдена" };
  }

  return {
    title: listingResult.data.title,
    description: truncateText(listingResult.data.description || listingResult.data.title, 160),
    openGraph: listingResult.data.imageUrl
      ? {
          images: [
            {
              url: listingResult.data.imageUrl,
              alt: listingResult.data.title,
            },
          ],
        }
      : undefined,
  };
}

export default async function PublicListingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { listingResult, guideResult, reviewRecords } = await getListingPageData(slug);
  if (!listingResult.data) notFound();

  const l = listingResult.data;

  const listing: PublicListing = {
    slug: l.slug,
    title: l.title,
    city: l.destinationName,
    region: l.destinationRegion,
    coverImageUrl: l.imageUrl,
    durationDays: Math.min(3, Math.max(1, l.durationDays)) as 1 | 2 | 3,
    priceFromRub: l.priceRub,
    groupSizeMax: l.groupSize,
    themes: [],
    highlights: l.description ? [l.description] : [l.title],
    itinerary: [{ title: l.title, description: l.description, durationHours: l.durationDays * 6 }],
    inclusions: l.inclusions.filter((v): v is PublicListingInclusion => true),
    guideSlug: l.guideSlug,
  };

  const guide = guideResult.data
    ? {
        slug: guideResult.data.slug,
        displayName: guideResult.data.fullName,
        homeBase: guideResult.data.homeBase,
        avatarImageUrl: guideResult.data.avatarUrl,
        avatarInitials: guideResult.data.initials,
        reviewsSummary: {
          averageRating: guideResult.data.rating,
          totalReviews: guideResult.data.reviewCount,
        },
      }
    : undefined;

  const reviews = reviewRecords.map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    author: { displayName: r.authorName },
    target: { type: "listing" as const, slug },
    rating: r.rating as 1 | 2 | 3 | 4 | 5,
    title: r.title,
    body: r.body,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: l.title,
    description: l.description,
    image: l.imageUrl ? [l.imageUrl] : undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: l.destinationName,
      addressRegion: l.destinationRegion,
      addressCountry: "RU",
    },
    offers: {
      "@type": "Offer",
      price: l.priceRub,
      priceCurrency: "RUB",
      availability: "https://schema.org/InStock",
      url: `https://provodnik.app/listings/${l.slug}`,
    },
    url: `https://provodnik.app/listings/${l.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <ListingDetailScreen listing={listing} guide={guide} reviews={reviews} />
    </>
  );
}
