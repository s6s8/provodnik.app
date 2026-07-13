import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { getGuideBySlug, getListingsByGuide, getGuideReviews, getGuideLocationPhotos } from "@/data/supabase/queries";
import { isQaGuideSlug } from "@/lib/supabase/queries-core";
import type { PublicGuideProfile } from "@/data/public-guides/types";
import { THEMES } from "@/data/themes";
import { GuideProfileScreen } from "@/features/guide/components/public/guide-profile-screen";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { serializeJsonLd } from "@/lib/seo/json-ld";

const getGuidePageData = cache(async (slug: string) => {
  const supabase = await createSupabaseServerClient();
  const guideResult = await getGuideBySlug(supabase, slug);
  if (!guideResult.data) {
    return {
      guideResult,
      listingRecords: [],
      reviewRecords: [],
      photos: [],
    };
  }

  const [listingsResult, reviewsResult, photosResult] = await Promise.all([
    getListingsByGuide(supabase, guideResult.data.id),
    getGuideReviews(supabase, slug),
    getGuideLocationPhotos(supabase, guideResult.data.id),
  ]);

  const photos = (photosResult.data ?? []).map((p) => ({
    id: p.id,
    locationName: p.location_name,
    imageUrl: supabase.storage.from("guide-portfolio").getPublicUrl(p.object_path).data.publicUrl,
  }));

  return {
    guideResult,
    listingRecords: listingsResult.data ?? [],
    reviewRecords: reviewsResult.data ?? [],
    photos,
  };
});


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
    alternates: {
      canonical: `/guides/${slug}`,
    },
  };
}

export default async function PublicGuideProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Seed/QA guide accounts must not be reachable in the public catalog (F-10).
  if (isQaGuideSlug(slug)) notFound();

  const { guideResult, listingRecords, reviewRecords, photos } = await getGuidePageData(slug);
  if (!guideResult.data) notFound();

  const g = guideResult.data;

  // Canonical theme slugs (specializations) → labels, merged with the guide's
  // free-text specialties, deduped case-insensitively.
  const themeLabelBySlug = new Map<string, string>(THEMES.map((t) => [t.slug, t.label]));
  const specializationLabels = (g.specializations ?? [])
    .map((slug) => themeLabelBySlug.get(slug))
    .filter((label): label is string => Boolean(label));
  const seenTags = new Set<string>();
  const specialtyTags = [...specializationLabels, ...g.specialties].filter((tag) => {
    const key = tag.trim().toLowerCase();
    if (!key || seenTags.has(key)) return false;
    seenTags.add(key);
    return true;
  });

  const guide: PublicGuideProfile = {
    slug: g.slug,
    displayName: g.fullName,
    headline: "",
    homeBase: g.homeBase,
    verificationStatus: g.verified ? "approved" : "draft",
    completedTours: g.tripsCompleted,
    tripsCompleted: g.tripsCompleted,
    recommendPct: g.recommendPct,
    avatarInitials: g.initials,
    avatarImageUrl: g.avatarUrl,
    yearsExperience: g.experienceYears,
    regions: g.destinations,
    languages: g.languages,
    specialties: specialtyTags,
    bio: g.bio,
    reviewsSummary: {
      averageRating: g.rating,
      totalReviews: g.reviewCount,
    },
  };

  const listings = listingRecords.map((l) => ({
    slug: l.slug,
    title: l.title,
    coverImageUrl: l.imageUrl,
    priceFromRub: l.priceRub,
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
      <GuideProfileScreen guide={guide} listings={listings} reviews={reviews} photos={photos} />
    </>
  );
}

export const revalidate = 3600;
