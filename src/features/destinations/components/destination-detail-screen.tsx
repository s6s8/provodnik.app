import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { ImmersiveHero } from "@/components/shared/immersive-hero";
import { OpenGroupCard } from "@/components/shared/open-group-card";
import { PublicGuideCard } from "@/components/shared/public-guide-card";
import { Button } from "@/components/ui/button";
import { formatRubNumber } from "@/data/money";
import type { DestinationSummary } from "@/data/destinations/types";
import type { OpenRequestRecord } from "@/data/open-requests/types";
import type { GuideRecord, ListingRecord } from "@/data/supabase/queries";
import { brandGradient, cityImage } from "@/lib/city-image";
import { ROUTES } from "@/lib/navigation";
import { pluralize } from "@/lib/utils";

import { ListingsFilter } from "./listings-filter";

function derivePrice(budgetPerPersonRub?: number): string | undefined {
  if (!budgetPerPersonRub) return undefined;
  return `${formatRubNumber(budgetPerPersonRub)} ₽ / чел`;
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
  const heroImage = destination.imageUrl || brandGradient(destination.name ?? "destination");

  const listingCount = listings.length > 0 ? listings.length : (destination.listingCount ?? 0);
  const formingGroupCount =
    destination.openRequestCount && destination.openRequestCount > 0
      ? destination.openRequestCount
      : openRequests.length;
  const minPrice = listings.length
    ? Math.min(...listings.map((l) => l.priceRub))
    : null;
  const showRegionCrumb = Boolean(
    destination.region &&
      destination.region.trim().toLowerCase() !== destination.name.trim().toLowerCase(),
  );

  return (
    <div>
      <ImmersiveHero
        navBleed
        imageUrl={heroImage}
        breadcrumb={[
          { label: "Направления", href: "/destinations" },
          ...(showRegionCrumb ? [{ label: destination.region! }] : []),
          { label: destination.name, current: true },
        ]}
        title={destination.name}
        intro={destination.description || undefined}
      >
        <div className="flex flex-wrap gap-2.5">
          <Button asChild>
            <Link href={`/guides?region=${encodeURIComponent(destination.region ?? "")}`}>Найти гида</Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            <a href="#tours">Смотреть маршруты</a>
          </Button>
        </div>
      </ImmersiveHero>

      <section className="bg-surface-low py-8">
        <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4 md:gap-12">
            <div>
              <strong className="block font-sans text-[2.25rem] font-semibold text-foreground">
                {listingCount}
              </strong>
              <span className="text-sm text-muted-foreground">готовых экскурсий</span>
            </div>

            <div>
              <strong className="block font-sans text-[2.25rem] font-semibold text-foreground">
                {minPrice
                  ? `${formatRubNumber(minPrice)} ₽`
                  : listingCount > 0 ? "Скоро" : "—"}
              </strong>
              <span className="text-sm text-muted-foreground">бюджет от</span>
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
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-2 font-sans text-xs font-medium tracking-[0.18em] uppercase text-muted-foreground">
                  Сборные группы
                </p>
                <h2 className="font-display text-[clamp(1.875rem,3.5vw,2.375rem)] font-semibold leading-[1.1]">
                  Путешественники ищут компанию
                </h2>
              </div>
              <Link href="/requests" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Все запросы по направлению
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {openRequests.slice(0, 3).map((request) => {
                const location = request.destinationLabel.split(",")[0].trim();
                return (
                  <OpenGroupCard
                    key={request.id}
                    href={`/requests/${request.id}`}
                    city={location}
                    region={request.regionLabel}
                    imageUrl={request.cityImageUrl || request.imageUrl || cityImage(location)}
                    status={request.status === "matched" ? "selected" : "waiting"}
                    minPeople={`от ${request.group.sizeTarget} чел.`}
                    date={request.dateRangeLabel}
                    datesFlexible={request.datesFlexible}
                    timeFlexible={request.timeFlexible}
                    time={request.timeLabel}
                    interests={request.interests}
                    members={request.members}
                    participantCount={request.group.sizeCurrent}
                    owner={request.isOwner}
                    member={request.isMember}
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
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 font-sans text-xs font-medium tracking-[0.18em] uppercase text-muted-foreground">
                Готовые экскурсии
              </p>
              <h2 className="font-display text-[clamp(1.875rem,3.5vw,2.375rem)] font-semibold leading-[1.1]">
                Авторские маршруты с гидами
              </h2>
            </div>
            <Link href="/listings" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
              Все экскурсии
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <ListingsFilter listings={listings} />
        </div>
      </section>

      {/* Open requests for this city */}
      <section className="py-sec-pad" id="requests">
        <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 font-sans text-xs font-medium tracking-[0.18em] uppercase text-muted-foreground">
                Активные запросы
              </p>
              <h2 className="font-display text-[clamp(1.875rem,3.5vw,2.375rem)] font-semibold leading-[1.1]">
                Путешественники ищут гида в {destination.name}
              </h2>
            </div>
            <Link
              href={`/requests?city=${encodeURIComponent(destination.name)}`}
              className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary"
            >
              Все запросы
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {formingGroupCount > 0 ? (
              <p className="text-base text-foreground">
                Сейчас {formingGroupCount}{" "}
                {pluralize(
                  formingGroupCount,
                  "активный запрос",
                  "активных запроса",
                  "активных запросов",
                )}{" "}
                — путешественники ищут гида в {destination.name}.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Сейчас нет активных запросов по этому направлению.
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href={ROUTES.newRequest.href}>Создать запрос</Link>
            </Button>
          </div>
        </div>
      </section>

      {destination.region ? (
        <section className="py-sec-pad" id="guides">
          <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
            <div className="mb-7">
              <p className="mb-2 font-sans text-xs font-medium tracking-[0.18em] uppercase text-muted-foreground">
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
                    slug={guide.slug}
                    fullName={guide.fullName}
                    initials={guide.initials}
                    avatarUrl={guide.avatarUrl}
                    rating={guide.rating}
                    reviewCount={guide.reviewCount}
                    verified={guide.verified}
                    experienceYears={guide.experienceYears}
                    specialties={guide.specialties}
                    tripsCompleted={guide.tripsCompleted}
                    recommendPct={guide.recommendPct}
                    languages={guide.languages}
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
