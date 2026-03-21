import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSeededOpenRequests } from "@/data/open-requests/seed";
import type { OpenRequestRecord, OpenRequestStatus } from "@/data/open-requests/types";
import { getSeededPublicGuide } from "@/data/public-guides/seed";
import { seededPublicGuides } from "@/data/public-guides/seed";
import { seededPublicListings } from "@/data/public-listings/seed";
import { PublicListingCard } from "@/features/listings/components/public/public-listing-card";

function formatRub(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getStatusLabel(status: OpenRequestStatus) {
  if (status === "forming_group") return "Группа формируется";
  if (status === "matched") return "Группа согласована";
  if (status === "closed") return "Набор закрыт";
  return "Открыт набор";
}

function getOfferPrice(request: OpenRequestRecord) {
  if (typeof request.budgetPerPersonRub === "number") return request.budgetPerPersonRub;
  if (request.priceScenarios && request.priceScenarios.length > 0) {
    return request.priceScenarios[0].pricePerPersonRub;
  }
  return 0;
}

function getFallbackAvatar(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return initials || "Г";
}

export function GuideProfile({ guideId }: { guideId: string }) {
  const guide = getSeededPublicGuide(guideId);
  if (!guide) return null;

  const listings = seededPublicListings.filter((listing) => listing.guideSlug === guide.slug);
  const citiesCovered = new Set(listings.map((listing) => listing.city)).size;

  const activeOffers = getSeededOpenRequests()
    .filter((request) => request.status === "open" || request.status === "forming_group")
    .filter((_, index) => seededPublicGuides[index % seededPublicGuides.length]?.slug === guide.slug)
    .slice(0, 3);

  const completedTours = listings.slice(0, 5).map((listing, index) => {
    const completedAt = new Date();
    completedAt.setDate(completedAt.getDate() - (index + 1) * 12);

    const rating = Math.max(4.5, Math.min(5, guide.reviewsSummary.averageRating - index * 0.05));
    return {
      slug: listing.slug,
      title: listing.title,
      completedAt,
      rating,
    };
  });

  return (
    <div className="flex flex-col gap-12">
      <section className="glass-panel rounded-[2rem] border border-white/10 p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10 text-xl font-semibold text-white">
              {guide.avatarImageUrl ? (
                <Image
                  src={guide.avatarImageUrl}
                  alt={`Портрет гида ${guide.displayName}`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <span>{getFallbackAvatar(guide.displayName)}</span>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {guide.displayName}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span>★ {guide.reviewsSummary.averageRating.toFixed(1)}</span>
                  <span>{guide.reviewsSummary.totalReviews} отзывов</span>
                  <span>{listings.length} туров</span>
                  <span>{citiesCovered} города</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {guide.specialties.map((specialty) => (
                  <Badge key={specialty} variant="secondary" className="rounded-full">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Button asChild size="lg" className="rounded-full px-6">
            <Link href="/requests/new">Предложить тур моей группе</Link>
          </Button>
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <p className="editorial-kicker">Публичный каталог</p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Туры этого гида
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing) => (
            <PublicListingCard key={listing.slug} listing={listing} />
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Предложения группам
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {activeOffers.map((offer) => (
            <Card key={offer.id} className="border-white/10">
              <CardContent className="space-y-4 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-lg font-semibold text-foreground">{offer.destinationLabel}</p>
                  <Badge variant="outline" className="rounded-full border-white/10 bg-white/5">
                    {getStatusLabel(offer.status)}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>{offer.dateRangeLabel}</p>
                  <p>
                    Группа: {offer.group.sizeCurrent}/{offer.group.sizeTarget}
                  </p>
                  <p>Цена: {formatRub(getOfferPrice(offer))} / чел.</p>
                </div>
                <Button asChild variant="outline" className="rounded-full border-white/10 bg-white/5">
                  <Link href={`/requests/${offer.id}`}>Рассмотреть</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Завершенные экскурсии
        </h2>
        <div className="glass-panel rounded-[1.5rem] border border-white/10">
          <ul className="divide-y divide-white/10">
            {completedTours.map((tour) => (
              <li key={tour.slug} className="flex flex-wrap items-center justify-between gap-2 p-4 sm:px-6">
                <Link
                  href={`/listings/${tour.slug}`}
                  className="text-sm font-medium text-foreground transition-colors hover:text-primary"
                >
                  {tour.title}
                </Link>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>★ {tour.rating.toFixed(1)}</span>
                  <span>{formatDateLabel(tour.completedAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
