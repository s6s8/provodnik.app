import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock3, MapPin, Star, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MarketplaceQualitySnapshot } from "@/data/quality/seed";
import type { ReviewRecord, ReviewsSummary } from "@/data/reviews/types";
import type { PublicGuideProfile } from "@/data/public-guides/types";
import type { PublicListing, PublicListingInclusion } from "@/data/public-listings/types";
import { ItineraryTravelSegment } from "@/features/listings/components/public/itinerary-travel-segment";
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

type ListingDetailProps = {
  listing: PublicListing;
  guide: PublicGuideProfile;
  quality: MarketplaceQualitySnapshot;
  guideTourCount: number;
  listingReviewsSummary: ReviewsSummary;
  listingReviews: ReviewRecord[];
};

export function ListingDetail({
  listing,
  guide,
  quality,
  guideTourCount,
  listingReviewsSummary,
  listingReviews,
}: ListingDetailProps) {
  const hasListingReviews = listingReviewsSummary.totalReviews > 0 || listingReviews.length > 0;
  const included = listing.inclusions;
  const excluded = DEFAULT_EXCLUSIONS.filter((item) => !included.includes(item));

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black min-h-[400px]">
        <Image
          src={listing.coverImageUrl ?? DEFAULT_COVER}
          alt={`Экскурсия ${listing.title}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 1400px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/10" />
        <div className="relative flex min-h-[400px] flex-col justify-end gap-5 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <InfoPill icon={<MapPin className="size-4" />} text={`${listing.city}, ${listing.region}`} />
            <InfoPill icon={<CalendarDays className="size-4" />} text={formatDays(listing.durationDays)} />
            <InfoPill icon={<Users className="size-4" />} text={`До ${listing.groupSizeMax} человек`} />
          </div>

          <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {listing.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-black/30 px-3 py-2 backdrop-blur">
              <GuideAvatar guide={guide} sizeClassName="size-10" />
              <div className="text-sm">
                <p className="font-medium text-white">{guide.displayName}</p>
                <p className="text-white/70">Ваш проводник по маршруту</p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-sm text-white backdrop-blur">
              <Star className="size-4 fill-current text-amber-300" />
              <span>{guide.reviewsSummary.averageRating.toFixed(1)}</span>
              <span className="text-white/60">· {guide.reviewsSummary.totalReviews} отзывов</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card className="border-white/10 bg-white/8 backdrop-blur-xl">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl">О туре</CardTitle>
              <CardDescription className="text-white/70">
                Это не мгновенная покупка: вы создаете запрос, согласуете детали с гидом
                и только затем подтверждаете поездку.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {listing.highlights.map((highlight) => (
                  <div
                    key={highlight}
                    className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4 text-sm text-white/80"
                  >
                    {highlight}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/8 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Что включено в стоимость</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">Включено</p>
                <div className="flex flex-wrap gap-2">
                  {included.map((item) => (
                    <Badge
                      key={item}
                      variant="outline"
                      className="rounded-full border-white/15 bg-white/10 px-3 py-1.5 text-white/85"
                    >
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">Не включено</p>
                <div className="flex flex-wrap gap-2">
                  {excluded.map((item) => (
                    <Badge
                      key={item}
                      variant="outline"
                      className="rounded-full border-white/10 bg-transparent px-3 py-1.5 text-white/65"
                    >
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/8 backdrop-blur-xl">
            <CardHeader className="space-y-2">
              <h3 className="text-2xl font-semibold tracking-tight">Маршрут экскурсии</h3>
              <CardDescription className="text-white/70">
                Около {listing.itinerary.reduce((sum, item) => sum + item.durationHours, 0).toFixed(1)} ч
                активной программы и логистика между точками.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {listing.itinerary.map((item, index) => {
                const hasNext = index < listing.itinerary.length - 1;
                const segmentMinutes = item.travelToNextMinutes ?? 15 + index * 5;
                const segmentOptions = item.transportOptions ?? ["taxi", "own_car"];
                return (
                  <div key={`${item.title}-${index}`} className="space-y-0">
                    <ItineraryStopCard
                      index={index + 1}
                      title={item.title}
                      description={item.description}
                      durationHours={item.durationHours}
                    />
                    {hasNext ? (
                      <ItineraryTravelSegment
                        minutes={segmentMinutes}
                        label={item.travelToNextLabel}
                        options={segmentOptions}
                        className="my-1"
                      />
                    ) : null}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {hasListingReviews ? (
            <PublicReviewsSection
              title="Отзывы о маршруте"
              target={{ type: "listing", slug: listing.slug }}
              initialSummary={listingReviewsSummary}
              initialReviews={listingReviews}
            />
          ) : null}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Card className="border-white/10 bg-white/8 backdrop-blur-xl">
            <CardHeader className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Бронирование</p>
              <CardTitle className="text-3xl font-semibold tracking-tight">
                От {formatRub(listing.priceFromRub)}
              </CardTitle>
              <CardDescription className="text-white/75">
                Не мгновенная покупка: Provodnik работает по demand-first модели с запросами
                и подтверждением условий.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button asChild size="lg" className="w-full">
                  <Link href="/traveler/requests/new">Создать запрос на этот тур</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full border-white/20 bg-white/5">
                  <Link href="/requests">Присоединиться к группе</Link>
                </Button>
              </div>
              <p className="text-xs leading-6 text-white/60">
                Итог зависит от размера группы, даты и логистики. Финальные условия подтверждаются
                после диалога с гидом.
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/8 backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Ваш гид</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/guides/${guide.slug}`}
                className="block rounded-[1.2rem] border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <div className="flex items-center gap-3">
                  <GuideAvatar guide={guide} sizeClassName="size-12" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{guide.displayName}</p>
                    <p className="truncate text-sm text-white/65">{guide.headline}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/70">
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1">
                    <Star className="size-3.5 fill-current text-amber-300" />
                    {guide.reviewsSummary.averageRating.toFixed(1)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1">
                    <Users className="size-3.5" />
                    {guideTourCount} туров
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1">
                    <Clock3 className="size-3.5" />
                    {quality.responseTimeHours.toFixed(1)} ч ответ
                  </span>
                </div>
              </Link>
            </CardContent>
          </Card>

          <MarketplaceQualityCard
            title="Качество маршрута"
            description="Скорость ответа, завершенные поездки и отмены влияют на приоритет показа."
            snapshot={quality}
          />
        </aside>
      </div>
    </div>
  );
}

function ItineraryStopCard({
  index,
  title,
  description,
  durationHours,
}: {
  index: number;
  title: string;
  description: string;
  durationHours: number;
}) {
  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground">
          {index}
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-lg font-semibold tracking-tight text-white">{title}</h4>
            <Badge variant="outline" className="rounded-full border-white/15 bg-white/10 px-3 text-white/80">
              {durationHours} ч
            </Badge>
          </div>
          <p className="text-sm leading-7 text-white/75">{description}</p>
        </div>
      </div>
    </article>
  );
}

function getGuideInitials(guide: PublicGuideProfile) {
  if (guide.avatarInitials?.trim()) {
    return guide.avatarInitials.trim().slice(0, 2);
  }

  return guide.displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function GuideAvatar({
  guide,
  sizeClassName,
}: {
  guide: PublicGuideProfile;
  sizeClassName: string;
}) {
  return (
    <div
      className={`relative ${sizeClassName} shrink-0 overflow-hidden rounded-full border border-white/15 bg-white/10`}
    >
      {guide.avatarImageUrl ? (
        <Image
          src={guide.avatarImageUrl}
          alt={guide.displayName}
          fill
          sizes={sizeClassName === "size-10" ? "40px" : "48px"}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-white">
          {getGuideInitials(guide)}
        </div>
      )}
    </div>
  );
}

function InfoPill({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-sm text-white/90 backdrop-blur">
      {icon}
      {text}
    </span>
  );
}

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&h=1200&q=80";

const DEFAULT_EXCLUSIONS: readonly PublicListingInclusion[] = [
  "Локальный транспорт",
  "Билеты в музеи",
  "Чай и перекус",
  "Снаряжение",
];
