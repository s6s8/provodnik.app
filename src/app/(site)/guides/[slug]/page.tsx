import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getGuideBySlug, getListingsByGuide, getGuideReviews } from "@/data/supabase/queries";
import type { PublicGuideProfile } from "@/data/public-guides/types";
import { GuideProfileScreen } from "@/features/guide/components/public/guide-profile-screen";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getGuideBySlug(null as any, slug);
  if (!result.data) return { title: "Гид не найден" };

  return {
    title: `${result.data.fullName} | Гид Provodnik`,
    description: result.data.bio,
  };
}

export default async function PublicGuideProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const guideResult = await getGuideBySlug(null as any, slug);
  if (!guideResult.data) notFound();

  const g = guideResult.data;
  const listingsResult = await getListingsByGuide(null as any, g.id);
  const reviewsResult = await getGuideReviews(null as any, slug);

  const guide: PublicGuideProfile = {
    slug: g.slug,
    displayName: g.fullName,
    headline: g.bio.slice(0, 120),
    homeBase: g.homeBase,
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

  const listings = (listingsResult.data ?? []).map((l) => ({
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

  const reviews = (reviewsResult.data ?? []).map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    author: { displayName: r.authorName },
    target: { type: "guide" as const, slug },
    rating: r.rating as 1 | 2 | 3 | 4 | 5,
    title: r.title,
    body: r.body,
  }));

  return <GuideProfileScreen guide={guide} listings={listings} reviews={reviews} />;
}
