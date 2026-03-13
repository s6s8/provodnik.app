import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CalendarDays, Check, Clock3, MapPinned, ShieldCheck, Users } from "lucide-react";

import { FavoriteToggle } from "@/components/shared/favorite-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSeededPublicGuide } from "@/data/public-guides/seed";
import { getSeededPublicListing } from "@/data/public-listings/seed";
import { getListingQualitySnapshot } from "@/data/quality/seed";
import {
  getSeededReviewsSummaryForTarget,
  listSeededReviewsForTarget,
} from "@/data/reviews/seed";
import {
  getPublishedReviewsSummaryForTargetFromSupabase,
  listPublishedReviewsForTargetFromSupabase,
} from "@/data/reviews/supabase";
import { PublicGuideTrustMarkers } from "@/features/guide/components/public/public-guide-trust-markers";
import { ListingCoverArt } from "@/features/listings/components/public/listing-cover-art";
import { MarketplaceQualityCard } from "@/features/quality/components/marketplace-quality-card";
import { PublicReviewsSection } from "@/features/reviews/components/public/public-reviews-section";

function formatRub(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDays(days: number) {
  if (days === 1) return "1 день";
  if (days < 5) return `${days} дня`;
  return `${days} дней`;
}

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
  const totalHours = listing.itinerary.reduce((sum, item) => sum + item.durationHours, 0);

  const seededGuideSummary = getSeededReviewsSummaryForTarget("guide", guide.slug);
  const seededGuideReviews = listSeededReviewsForTarget("guide", guide.slug);
  const seededListingSummary = getSeededReviewsSummaryForTarget("listing", listing.slug);
  const seededListingReviews = listSeededReviewsForTarget("listing", listing.slug);

  const [
    persistedGuideSummary,
    persistedGuideReviews,
    persistedListingSummary,
    persistedListingReviews,
  ] = await Promise.all([
    getPublishedReviewsSummaryForTargetFromSupabase({ type: "guide", slug: guide.slug }).catch(
      () => null,
    ),
    listPublishedReviewsForTargetFromSupabase({ type: "guide", slug: guide.slug }).catch(
      () => [],
    ),
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
    <div className="space-y-10">
      <section className="grid gap-5 xl:grid-cols-[1.12fr_0.88fr] xl:items-stretch">
        <ListingCoverArt listing={listing} className="h-full min-h-[26rem]" />

        <Card className="glass-panel rounded-[2.2rem] border border-white/70 xl:sticky xl:top-24">
          <CardHeader className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Бронирование
                </p>
                <CardTitle className="text-3xl font-semibold tracking-tight">
                  От {formatRub(listing.priceFromRub)}
                </CardTitle>
                <CardDescription className="text-sm leading-7">
                  Итог зависит от даты, состава группы и логистики. Сначала вы
                  отправляете запрос, затем гид подтверждает детали и финальную цену.
                </CardDescription>
              </div>
              <FavoriteToggle
                targetType="listing"
                slug={listing.slug}
                label={`Сохранить экскурсию ${listing.title}`}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoPill icon={<CalendarDays className="size-4" />} text={formatDays(listing.durationDays)} />
              <InfoPill icon={<Users className="size-4" />} text={`До ${listing.groupSizeMax} человек`} />
              <InfoPill icon={<Clock3 className="size-4" />} text={`Ответ в среднем ${quality.responseTimeHours.toFixed(1)} ч`} />
              <InfoPill icon={<MapPinned className="size-4" />} text={listing.city} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[1.6rem] border border-border/70 bg-white/76 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Что входит
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {listing.inclusions.map((item) => (
                  <Badge key={item} variant="secondary" className="rounded-full px-3">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full rounded-full">
                <Link href="/traveler">Отправить запрос на бронирование</Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-full">
                <Link href={`/guides/${guide.slug}`}>Смотреть профиль гида</Link>
              </Button>
            </div>

            <p className="text-xs leading-6 text-muted-foreground">
              Продолжая, вы принимаете{" "}
              <Link href="/policies/cancellation" className="underline underline-offset-4">
                правила отмены
              </Link>{" "}
              и{" "}
              <Link href="/policies/refunds" className="underline underline-offset-4">
                возвратов
              </Link>
              . Кнопка ведет в личный кабинет путешественника для оформления заявки.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="section-frame rounded-[2rem]">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Что вас ждет на маршруте</CardTitle>
            <CardDescription>
              {formatDays(listing.durationDays)} · около {totalHours.toFixed(1)} часа активной программы
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {listing.itinerary.map((item, index) => (
              <div
                key={item.title}
                className="rounded-[1.5rem] border border-border/70 bg-white/72 p-4 sm:p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground">
                    {index + 1}
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold tracking-tight text-foreground">
                        {item.title}
                      </h2>
                      <Badge variant="outline" className="rounded-full px-3">
                        {item.durationHours} ч
                      </Badge>
                    </div>
                    <p className="text-sm leading-7 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <div className="grid gap-3 sm:grid-cols-2">
              {listing.highlights.map((highlight) => (
                <div
                  key={highlight}
                  className="rounded-[1.5rem] border border-border/70 bg-white/72 p-4"
                >
                  <div className="flex items-start gap-3">
                    <Check className="mt-0.5 size-4 text-primary" />
                    <p className="text-sm leading-7 text-muted-foreground">{highlight}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5">
          <Card className="glass-panel rounded-[2rem] border border-white/70">
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl">Ваш гид</CardTitle>
              <CardDescription>
                До бронирования видно, кто ведет маршрут и какие у него сигналы доверия.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[1.5rem] border border-border/70 bg-white/72 p-4">
                <p className="text-lg font-semibold tracking-tight text-foreground">
                  {guide.displayName}
                </p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {guide.headline}
                </p>
              </div>
              <PublicGuideTrustMarkers trustMarkers={guide.trustMarkers} />
            </CardContent>
          </Card>

          <MarketplaceQualityCard
            title="Качество маршрута"
            description="Скорость ответа, завершенные поездки и отмены влияют на видимость в каталоге."
            snapshot={quality}
          />

          <PublicReviewsSection
            title="Отзывы о гиде"
            target={{ type: "guide", slug: guide.slug }}
            initialSummary={persistedGuideSummary ?? seededGuideSummary}
            initialReviews={persistedGuideReviews.length > 0 ? persistedGuideReviews : seededGuideReviews}
          />
        </div>
      </section>

      <PublicReviewsSection
        title="Отзывы о маршруте"
        target={{ type: "listing", slug: listing.slug }}
        initialSummary={persistedListingSummary ?? seededListingSummary}
        initialReviews={persistedListingReviews.length > 0 ? persistedListingReviews : seededListingReviews}
      />

      <section className="section-frame rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="editorial-kicker">Безопасность</p>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Условия поездки и поддержка видны заранее
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              На карточке маршрута заранее указаны правила отмены и возвратов. Если
              что-то меняется после бронирования, спор попадает в операторскую очередь,
              а решение фиксируется в системе.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full px-5">
            <Link href="/trust">
              <ShieldCheck className="mr-2 size-4" />
              Как сервис защищает бронирование
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function InfoPill({
  icon,
  text,
}: {
  icon: ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border/70 bg-white/72 px-4 py-2 text-sm font-medium text-foreground">
      <span className="text-primary">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
