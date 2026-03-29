import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSeededPublicGuide } from "@/data/public-guides/seed";
import { seededPublicListings } from "@/data/public-listings/seed";
import { listSeededReviewsForTarget } from "@/data/reviews/seed";
import { GuideProfileScreen } from "@/features/guide/components/public/guide-profile-screen";

export function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  return params.then(({ id }) => {
    const guide = getSeededPublicGuide(id);
    if (!guide) return { title: "Гид не найден" };
    return {
      title: `${guide.displayName} | Гид Provodnik`,
      description: guide.headline,
    };
  });
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const guide = getSeededPublicGuide(id);
  if (!guide) notFound();

  const listings = seededPublicListings.filter((l) => l.guideSlug === guide.slug);
  const reviews = listSeededReviewsForTarget("guide", guide.slug);

  return <GuideProfileScreen guide={guide} listings={listings} reviews={reviews} />;
}
