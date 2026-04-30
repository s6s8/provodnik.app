import Image from "next/image";
import Link from "next/link";

import { ReqCard } from "@/components/shared/req-card";
import { Button } from "@/components/ui/button";
import type { DestinationSummary } from "@/data/destinations/types";
import type { OpenRequestRecord } from "@/data/open-requests/types";
import type { GuideRecord, ListingRecord } from "@/data/supabase/queries";
import { PublicGuideCard } from "@/features/guide/components/public/public-guide-card";
import { pluralize } from "@/lib/utils";

import { ListingsFilter } from "./listings-filter";

function derivePrice(budgetPerPersonRub?: number): string {
  if (!budgetPerPersonRub) return "По договорённости";
  return `${new Intl.NumberFormat("ru-RU").format(budgetPerPersonRub)} ₽ / чел`;
}

interface Props {
  destination: DestinationSummary;
  openRequests?: OpenRequestRecord[];
  listings?: ListingRecord[];
  guides?: GuideRecord[];
}

export function DestinationDetailScreen({
  destination,
  openRequests = [],
  listings = [],
  guides = [],
}: Props) {
  const heroImage =
    destination.imageUrl ||
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1800&q=80";

  const listingCount = listings.length > 0 ? listings.length : (destination.listingCount ?? 0);
  const formingGroupCount =
    destination.openRequestCount && destination.openRequestCount > 0
      ? destination.openRequestCount
      : openRequests.length;
  const minPrice = listings.length
    ? Math.min(...listings.map((l) => l.priceRub))
    : null;

  return (
    <div>
      <section className="-mt-nav-h relative flex min-h-[520px] items-end overflow-hidden pb-14 [--on-surface:#fff] [--on-surface-muted:rgba(255,255,255,0.72)]">
        <Image
          src={heroImage}
          alt={destination.name}
          fill
          priority
          sizes="100vw"
          className="z-0 object-cover"
        />

        <div
          className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,rgba(25,28,32,0.12)_0%,rgba(25,28,32,0.38)_55%,rgba(25,28,32,0.60)_100%)]"
          aria-hidden
        />

        <div className="relative z-[2] mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)] pt-[calc(var(--nav-h)+48px)] pb-14 [--on-surface:#fff] [--on-surface-muted:rgba(255,255,255,0.72)]">
          <div className="max-w-[720px]">
            {destination.region ? (
              <p className="mb-2 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-white/70">
                {destination.region}
              </p>
            ) : null}

            <h1 className="font-display text-[clamp(3rem,6vw,4.5rem)] font-semibold leading-[1.02]">
              {destination.name}
            </h1>

            {destination.description ? (
              <p className="mt-4 max-w-[560px] text-base leading-[1.65] text-white/80">
                {destination.description}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2.5">
              <span className="inline-flex items-center rounded-full border border-white/20 bg-glass px-3.5 py-1.5 text-sm font-semibold text-foreground leading-relaxed backdrop-blur-[12px]">
                Лучший сезон: весна / лето / осень
              </span>
              <span className="inline-flex items-center rounded-full border border-white/20 bg-glass px-3.5 py-1.5 text-sm font-semibold text-foreground leading-relaxed backdrop-blur-[12px]">
                Природа · Культура · Гастрономия
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <Button asChild>
                <Link href="/requests/new">Найти гида</Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <a href="#tours">Смотреть маршруты</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface-low py-8">
        <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4 md:gap-12">
            <div>
              <strong className="block font-sans text-[2.25rem] font-semibold text-foreground">
                {listingCount}
              </strong>
              <span className="text-sm text-muted-foreground">готовых туров</span>
            </div>

            <div>
              <strong className="block font-sans text-[2.25rem] font-semibold text-foreground">
                {minPrice
                  ? `${new Intl.NumberFormat("ru-RU").format(Math.round(minPrice / 1000))} тыс. ₽`
                  : listingCount > 0 ? "Скоро" : "—"}
              </strong>
              <span className="text-sm text-muted-foreground">бюджет от</span>
            </div>

            <div>
              <strong className="block font-sans text-[2.25rem] font-semibold text-foreground">
                4.9 ★
              </strong>
              <span className="text-sm text-muted-foreground">рейтинг гидов</span>
            </div>

            {formingGroupCount > 0 ? (
              <div>
                <strong className="block font-sans text-[2.25rem] font-semibold text-foreground">
                  {`${formingGroupCount} ${pluralize(formingGroupCount, "группа", "группы", "групп")}`}
                </strong>
                <span className="text-sm text-muted-foreground">формируется сейчас</span>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {openRequests.length > 0 && (
        <section className="py-sec-pad" id="groups">
          <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <p className="mb-2 font-sans text-[0.6875rem] font-medium tracking-[0.18em] uppercase text-muted-foreground">
                  Открытые группы
                </p>
                <h2 className="font-display text-[clamp(1.875rem,3.5vw,2.375rem)] font-semibold leading-[1.1]">
                  Путешественники ищут компанию
                </h2>
              </div>
              <Link href="/requests" className="text-sm font-semibold text-primary">
                Все запросы по направлению →
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {openRequests.slice(0, 3).map((request) => {
                const location = request.destinationLabel.split(",")[0].trim();
                const fillPct = Math.round(
                  (request.group.sizeCurrent / request.group.sizeTarget) * 100,
                );
                return (
                  <ReqCard
                    key={request.id}
                    href={`/requests/${request.id}`}
                    location={location}
                    spotsLabel={`${request.group.sizeCurrent} / ${request.group.sizeTarget} мест`}
                    title={request.highlights[0] ?? request.destinationLabel}
                    date={request.dateRangeLabel}
                    desc={request.highlights[1]}
                    fillPct={fillPct}
                    members={request.members}
                    price={derivePrice(request.budgetPerPersonRub)}
                  />
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="bg-surface-low py-sec-pad" id="tours">
        <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 font-sans text-[0.6875rem] font-medium tracking-[0.18em] uppercase text-muted-foreground">
                Готовые туры
              </p>
              <h2 className="font-display text-[clamp(1.875rem,3.5vw,2.375rem)] font-semibold leading-[1.1]">
                Авторские маршруты с гидами
              </h2>
            </div>
            <Link href="/listings" className="text-sm font-semibold text-primary">
              Все туры →
            </Link>
          </div>

          <ListingsFilter listings={listings} />
        </div>
      </section>

      {/* Open requests for this city */}
      <section className="py-sec-pad" id="requests">
        <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 font-sans text-[0.6875rem] font-medium tracking-[0.18em] uppercase text-muted-foreground">
                Активные запросы
              </p>
              <h2 className="font-display text-[clamp(1.875rem,3.5vw,2.375rem)] font-semibold leading-[1.1]">
                Путешественники ищут гида в {destination.name}
              </h2>
            </div>
            <Link
              href={`/requests?city=${encodeURIComponent(destination.name)}`}
              className="shrink-0 text-sm font-semibold text-primary"
            >
              Все запросы →
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Сейчас нет активных запросов по этому направлению.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/traveler/requests/new?destination=${encodeURIComponent(destination.name)}`}
              className="inline-flex items-center rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              Создать запрос
            </Link>
          </div>
        </div>
      </section>

      {destination.region ? (
        <section className="py-sec-pad" id="guides">
          <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
            <div className="mb-7">
              <p className="mb-2 font-sans text-[0.6875rem] font-medium tracking-[0.18em] uppercase text-muted-foreground">
                Местные гиды
              </p>
              <h2 className="font-display text-[clamp(1.875rem,3.5vw,2.375rem)] font-semibold leading-[1.1]">
                Гиды в этом направлении
              </h2>
            </div>

            {guides.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {guides.map((guide) => (
                  <PublicGuideCard
                    key={guide.id}
                    guide={{
                      id: guide.id,
                      slug: guide.slug,
                      name: guide.fullName,
                      avatarUrl: guide.avatarUrl ?? "",
                      rating: guide.rating,
                      tourCount: guide.reviewCount,
                      specialties: [],
                      cities: guide.destinations,
                    }}
                  />
                ))}
              </div>
            ) : (
              <p className="py-8 text-base text-muted-foreground">
                Гиды по этому направлению скоро появятся.
              </p>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
