import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSeededPublicGuide } from "@/data/public-guides/seed";
import { GuideProfile } from "@/features/guide/components/public/guide-profile";

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

  return <GuideProfile guideId={guide.slug} />;
}
