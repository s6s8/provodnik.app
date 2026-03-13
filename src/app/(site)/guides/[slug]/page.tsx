import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowRight, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getSeededPublicGuide } from "@/data/public-guides/seed";
import { getGuideQualitySnapshot } from "@/data/quality/seed";
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
import { MarketplaceQualityCard } from "@/features/quality/components/marketplace-quality-card";
import { PublicReviewsSection } from "@/features/reviews/components/public/public-reviews-section";

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

  const quality = getGuideQualitySnapshot(guide.slug);
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
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="editorial-kicker">Профиль местного гида</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Познакомьтесь с гидом до бронирования
          </h1>
        </div>
        <Button asChild variant="outline" className="rounded-full px-5">
          <Link href="/listings">
            Смотреть маршруты
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </div>

      <PublicGuideProfileBasics guide={guide} />

      <section className="grid gap-5 xl:grid-cols-3">
        <PublicGuideProfileSpecialties guide={guide} />
        <PublicGuideTrustMarkers trustMarkers={guide.trustMarkers} />
        <MarketplaceQualityCard
          title="Показатели работы"
          description="Скорость ответа, завершенные поездки и отмены влияют на видимость гида в каталоге."
          snapshot={quality}
        />
      </section>

      <section className="section-frame rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="editorial-kicker">Доверие и поддержка</p>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Решение о поездке принимается по реальным сигналам, а не по обещаниям
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              У гида есть модерация, подтвержденные данные профиля и операторская
              поддержка на случай спорных ситуаций. Турист видит эти маркеры до
              оформления заявки.
            </p>
          </div>
          <Button asChild className="rounded-full px-5">
            <Link href="/trust">
              <ShieldCheck className="mr-2 size-4" />
              Посмотреть правила сервиса
            </Link>
          </Button>
        </div>
      </section>

      <PublicReviewsSection
        title="Отзывы путешественников"
        target={{ type: "guide", slug: guide.slug }}
        initialSummary={persistedSummary ?? seededSummary}
        initialReviews={persistedReviews.length > 0 ? persistedReviews : seededReviews}
      />
    </div>
  );
}
