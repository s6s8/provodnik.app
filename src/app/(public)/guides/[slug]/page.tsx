import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSeededPublicGuide } from "@/data/public-guides/seed";
import { PublicGuideProfileBasics } from "@/features/guide/components/public/public-guide-profile-basics";
import { PublicGuideProfileSpecialties } from "@/features/guide/components/public/public-guide-profile-specialties";
import { PublicGuideReviewsSummary } from "@/features/guide/components/public/public-guide-reviews-summary";
import { PublicGuideTrustMarkers } from "@/features/guide/components/public/public-guide-trust-markers";

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

      <PublicGuideReviewsSummary summary={guide.reviewsSummary} />
    </div>
  );
}

