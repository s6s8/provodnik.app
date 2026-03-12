import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSeededPublicGuide } from "@/data/public-guides/seed";
import {
  getSeededReviewsSummaryForTarget,
  listSeededReviewsForTarget,
} from "@/data/reviews/seed";
import {
  getPublishedReviewsSummaryForTargetFromSupabase,
  listPublishedReviewsForTargetFromSupabase,
} from "@/data/reviews/supabase";
import { PublicGuideProfileBasics } from "@/features/guide/components/public/public-guide-profile-basics";
import { PublicGuideProfileSpecialties } from "@/features/guide/components/public/public-guide-profile-specialties";
import { PublicGuideTrustMarkers } from "@/features/guide/components/public/public-guide-trust-markers";
import { PublicReviewsSection } from "@/features/reviews/components/public/public-reviews-section";

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const guide = getSeededPublicGuide(params.slug);
  if (!guide) return { title: "Guide not found" };

  return {
    title: `${guide.displayName} - Guide profile`,
    description: guide.headline,
  };
}

export default async function PublicGuideProfilePage({
  params,
}: {
  params: { slug: string };
}) {
  const guide = getSeededPublicGuide(params.slug);
  if (!guide) notFound();

  const seededSummary = getSeededReviewsSummaryForTarget("guide", guide.slug);
  const seededReviews = listSeededReviewsForTarget("guide", guide.slug);
  const persistedSummary = await getPublishedReviewsSummaryForTargetFromSupabase({
    type: "guide",
    slug: guide.slug,
  }).catch(() => null);
  const persistedReviews = await listPublishedReviewsForTargetFromSupabase({
    type: "guide",
    slug: guide.slug,
  }).catch(() => []);

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Public guide profile</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Meet your guide
        </h1>
      </div>

      <PublicGuideProfileBasics guide={guide} />

      <div className="grid gap-4 lg:grid-cols-2">
        <PublicGuideProfileSpecialties guide={guide} />
        <PublicGuideTrustMarkers trustMarkers={guide.trustMarkers} />
      </div>

      <PublicReviewsSection
        title="Guide reviews"
        target={{ type: "guide", slug: guide.slug }}
        initialSummary={persistedSummary ?? seededSummary}
        initialReviews={persistedReviews.length > 0 ? persistedReviews : seededReviews}
      />
    </div>
  );
}

