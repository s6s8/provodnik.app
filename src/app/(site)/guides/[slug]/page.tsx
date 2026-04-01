import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { getGuideBySlug, getListingsByGuide, getGuideReviews } from "@/data/supabase/queries";
import type { PublicGuideProfile } from "@/data/public-guides/types";
import { GuideProfileScreen } from "@/features/guide/components/public/guide-profile-screen";

const getGuidePageData = cache(async (slug: string) => {
  const guideResult = await getGuideBySlug(null as any, slug);
  if (!guideResult.data) {
    return {
      guideResult,
      listingRecords: [],
      reviewRecords: [],
    };
  }

  const [listingsResult, reviewsResult] = await Promise.all([
    getListingsByGuide(null as any, guideResult.data.id),
    getGuideReviews(null as any, slug),
  ]);

  return {
    guideResult,
    listingRecords: listingsResult.data ?? [],
    reviewRecords: reviewsResult.data ?? [],
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
  const { guideResult } = await getGuidePageData(slug);

  if (!guideResult.data) {
    return { title: "Гид не найден" };
  }

  return {
    title: guideResult.data.fullName,
    description: guideResult.data.bio,
  };
}

export default async function PublicGuideProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { guideResult, listingRecords, reviewRecords } = await getGuidePageData(slug);
  if (!guideResult.data) notFound();

  const g = guideResult.data;

  const guide: PublicGuideProfile = {
    slug: g.slug,
    displayName: g.fullName,
    headline: g.bio.slice(0, 120),
    homeBase: g.homeBase,
    verificationStatus: "draft",
    completedTours: 0,
    avatarInitials: g.initials,
    avatarImageUrl: g.avatarUrl,
    yearsExperience: g.experienceYears,
    regions: g.destinations,
    languages: [],
    specialties: [],
    bio: g.bio,
    trustMarkers: { emailVerified: false, phoneVerified: false, identityVerified: false, backgroundCheck: false, references: false },
    reviewsSummary: {
      averageRating: g.rating,
      totalReviews: g.reviewCount,
    },
  };

  const listings = listingRecords.map((l) => ({
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
    inclusions: l.inclusions as any[],
    guideSlug: l.guideSlug,
  }));

  const reviews = reviewRecords.map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    author: { displayName: r.authorName },
    target: { type: "guide" as const, slug },
    rating: r.rating as 1 | 2 | 3 | 4 | 5,
    title: r.title,
    body: r.body,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: g.fullName,
    description: g.bio,
    image: g.avatarUrl,
    areaServed: g.destinations.length > 0 ? g.destinations : [g.homeBase],
    url: `https://provodnik.app/guides/${g.slug}`,
    aggregateRating:
      g.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: g.rating,
            reviewCount: g.reviewCount,
          }
        : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <GuideProfileScreen guide={guide} listings={listings} reviews={reviews} />
    </>
  );
}
