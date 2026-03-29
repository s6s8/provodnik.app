import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSeededPublicGuide } from "@/data/public-guides/seed";
import { getSeededPublicListing } from "@/data/public-listings/seed";
import { listSeededReviewsForTarget } from "@/data/reviews/seed";
import { listPublishedReviewsForTargetFromSupabase } from "@/data/reviews/supabase";
import { ListingDetailScreen } from "@/features/listings/components/public/listing-detail-screen";

export function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  return params.then(({ slug }) => {
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

  const seededReviews = listSeededReviewsForTarget("listing", listing.slug);
  const persistedReviews = await listPublishedReviewsForTargetFromSupabase({
    type: "listing",
    slug: listing.slug,
  }).catch(() => []);

  const reviews = persistedReviews.length > 0 ? persistedReviews : seededReviews;

  return <ListingDetailScreen listing={listing} guide={guide} reviews={reviews} />;
}
