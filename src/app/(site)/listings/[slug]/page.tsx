import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSeededPublicGuide } from "@/data/public-guides/seed";
import { getSeededPublicListing, seededPublicListings } from "@/data/public-listings/seed";
import { getListingQualitySnapshot } from "@/data/quality/seed";
import {
  getSeededReviewsSummaryForTarget,
  listSeededReviewsForTarget,
} from "@/data/reviews/seed";
import {
  getPublishedReviewsSummaryForTargetFromSupabase,
  listPublishedReviewsForTargetFromSupabase,
} from "@/data/reviews/supabase";
import { ListingDetail } from "@/features/listings/components/public/listing-detail";

export function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = params;
  return resolvedParams.then(({ slug }) => {
    const listing = getSeededPublicListing(slug);
    if (!listing) return { title: "Экскурсия не найдена" };

    return {
      title: `${listing.title} | Provodnik`,
      description: `${listing.city}, ${listing.region}. Цена, программа по шагам и профиль гида.`,
    };
  });
}

export default async function PublicListingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const listing = getSeededPublicListing(slug);
  if (!listing) notFound();

  const guide = getSeededPublicGuide(listing.guideSlug);
  if (!guide) notFound();

  const quality = getListingQualitySnapshot(listing.slug);
  const guideTourCount = seededPublicListings.filter((item) => item.guideSlug === guide.slug).length;

  const seededListingSummary = getSeededReviewsSummaryForTarget("listing", listing.slug);
  const seededListingReviews = listSeededReviewsForTarget("listing", listing.slug);

  const [persistedListingSummary, persistedListingReviews] = await Promise.all([
    getPublishedReviewsSummaryForTargetFromSupabase({
      type: "listing",
      slug: listing.slug,
    }).catch(() => null),
    listPublishedReviewsForTargetFromSupabase({
      type: "listing",
      slug: listing.slug,
    }).catch(() => []),
  ]);

  return (
    <ListingDetail
      listing={listing}
      guide={guide}
      quality={quality}
      guideTourCount={guideTourCount}
      listingReviewsSummary={persistedListingSummary ?? seededListingSummary}
      listingReviews={persistedListingReviews.length > 0 ? persistedListingReviews : seededListingReviews}
    />
  );
}
