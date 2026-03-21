import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSeededPublicGuide } from "@/data/public-guides/seed";
import { GuideProfile } from "@/features/guide/components/public/guide-profile";

export function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  return params.then(({ slug }) => {
    const guide = getSeededPublicGuide(slug);
    if (!guide) return { title: "Гид не найден" };

    return {
      title: `${guide.displayName} | Гид Provodnik`,
      description: guide.headline,
    };
  });
}

export default async function PublicGuideProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getSeededPublicGuide(slug);
  if (!guide) notFound();
  return <GuideProfile guideId={guide.slug} />;
}
