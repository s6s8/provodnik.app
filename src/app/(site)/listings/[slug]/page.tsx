import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getListingBySlug, getGuideBySlug, getListingReviews } from "@/data/supabase/queries";
import type { PublicListing, PublicListingInclusion } from "@/data/public-listings/types";
import { ListingDetailScreen } from "@/features/listings/components/public/listing-detail-screen";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const client = await createSupabaseServerClient();
  const result = await getListingBySlug(client, slug);
  if (!result.data) return { title: "Экскурсия не найдена" };

  return {
    title: `${result.data.title} | Provodnik`,
    description: `${result.data.destinationName}, ${result.data.destinationRegion}. Цена, программа по шагам и профиль гида.`,
  };
}

export default async function PublicListingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const client = await createSupabaseServerClient();

  const listingResult = await getListingBySlug(client, slug);
  if (!listingResult.data) notFound();

  const l = listingResult.data;
  const guideResult = await getGuideBySlug(client, l.guideSlug);
  const reviewsResult = await getListingReviews(client, slug);

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

  const reviews = (reviewsResult.data ?? []).map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    author: { displayName: r.authorName },
    target: { type: "listing" as const, slug },
    rating: r.rating as 1 | 2 | 3 | 4 | 5,
    title: r.title,
    body: r.body,
  }));

  return <ListingDetailScreen listing={listing} guide={guide} reviews={reviews} />;
}
