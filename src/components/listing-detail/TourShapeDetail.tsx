import { Star } from "lucide-react";
import Link from "next/link";

import { formatRubNumber } from "@/data/money";
import { TransferCrossSellWidget } from "@/features/listings/components/TransferCrossSellWidget";
import { BookingCard } from "@/components/listing-detail/BookingCard";
import { GuideCard } from "@/components/listing-detail/GuideCard";
import { TariffsList } from "@/components/listing-detail/TariffsList";
import { TourDeparturesList } from "@/components/listing-detail/TourDeparturesList";
import { TourItineraryDisplay } from "@/components/listing-detail/TourItineraryDisplay";
import { ImmersiveHero } from "@/components/shared/immersive-hero";
import { StickyActionBar } from "@/components/shared/sticky-action-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  GuideProfileRow,
  ListingDayRow,
  ListingMealRow,
  ListingPhotoRow,
  ListingRow,
  ListingTariffRow,
  ListingTourDepartureRow,
} from "@/lib/supabase/types";
import { maskPii } from "@/lib/pii/mask";
import { pluralize } from "@/lib/utils";

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Лёгкий",
  medium: "Средний",
  hard: "Сложный",
  extreme: "Экстремальный",
};

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: "Завтрак",
  lunch: "Обед",
  dinner: "Ужин",
};

const MEAL_STATUS_LABELS: Record<string, string> = {
  included: "Включён",
  paid_extra: "За доп. плату",
  not_included: "Не включён",
};

function formatRubMinor(minor: number): string {
  return formatRubNumber(Math.round(minor / 100));
}

type GuidePickProps = Pick<
  GuideProfileRow,
  | "user_id"
  | "slug"
  | "bio"
  | "average_rating"
  | "review_count"
  | "contact_visibility_unlocked"
  | "is_tour_operator"
  | "years_experience"
  | "specialties"
  | "languages"
  | "verification_status"
> & { full_name?: string | null; avatar_url?: string | null } | null;

interface Props {
  listing: ListingRow & { image_url?: string | null };
  photos: ListingPhotoRow[];
  tariffs: ListingTariffRow[];
  days: ListingDayRow[];
  meals: ListingMealRow[];
  departures: ListingTourDepartureRow[];
  guide: GuidePickProps;
}

export function TourShapeDetail({
  listing,
  tariffs,
  days,
  meals,
  departures,
  guide,
}: Props) {
  const description = maskPii(listing.description);
  const coverUrl = listing.image_url ?? null;

  const difficultyLabel = listing.difficulty_level
    ? (DIFFICULTY_LABELS[listing.difficulty_level] ?? listing.difficulty_level)
    : null;

  // Build a set of unique days from meals for the meals grid
  const mealDays = Array.from(new Set(meals.map((m) => m.day_number))).sort(
    (a, b) => a - b,
  );

  const priceLabel = `от ${formatRubMinor(listing.price_from_minor)} ₽`;

  const bookingCard = (
    <BookingCard
      listingId={listing.id}
      priceLabel={priceLabel}
      priceNote="на человека"
      rating={listing.average_rating}
      reviewCount={listing.review_count ?? 0}
      primaryLabel="Заказать тур"
    />
  );

  return (
    <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)] pb-28 pt-6 md:pb-12">
      <ImmersiveHero
        imageUrl={coverUrl ?? "/hero-valley.jpg"}
        imagePosition="center 44%"
        breadcrumb={[
          { label: "Экскурсии" },
          ...(listing.region ? [{ label: listing.region }] : []),
          { label: listing.title },
        ]}
        title={listing.title}
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge variant="outline">Тур</Badge>
        {difficultyLabel ? <Badge variant="secondary">{difficultyLabel}</Badge> : null}
        {guide?.is_tour_operator ? (
          <Badge variant="outline" className="border-primary/40 text-primary">
            Туроператор
          </Badge>
        ) : null}
        {listing.review_count > 0 ? (
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="size-3.5 fill-gold text-gold" /> {listing.average_rating.toFixed(1)} · {listing.review_count} {pluralize(listing.review_count, "отзыв", "отзыва", "отзывов")}
          </span>
        ) : null}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0 flex flex-col gap-8">
          <Tabs defaultValue="description">
            <TabsList className="w-full">
              <TabsTrigger value="description" className="flex-1">Описание</TabsTrigger>
              <TabsTrigger value="program" className="flex-1">Программа</TabsTrigger>
              <TabsTrigger value="dates" className="flex-1">Даты и цены</TabsTrigger>
            </TabsList>

            {/* ─── Описание ─────────────────────────────────────────── */}
            <TabsContent value="description" className="mt-6 flex flex-col gap-6">
              {description ? (
                <section className="flex flex-col gap-2">
                  <h2 className="text-lg font-semibold tracking-tight">Описание</h2>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                    {description}
                  </p>
                </section>
              ) : null}

              {listing.included.length > 0 ? (
                <section className="flex flex-col gap-2">
                  <h2 className="text-lg font-semibold tracking-tight">Включено</h2>
                  <div className="flex flex-wrap gap-2">
                    {listing.included.map((item) => (
                      <Badge key={item} variant="secondary">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </section>
              ) : null}

              {listing.not_included.length > 0 ? (
                <section className="flex flex-col gap-2">
                  <h2 className="text-lg font-semibold tracking-tight">Не включено</h2>
                  <div className="flex flex-wrap gap-2">
                    {listing.not_included.map((item) => (
                      <Badge key={item} variant="outline" className="text-muted-foreground">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </section>
              ) : null}

              {listing.accommodation &&
              Object.keys(listing.accommodation).length > 0 ? (
                <section className="flex flex-col gap-2">
                  <h2 className="text-lg font-semibold tracking-tight">Проживание</h2>
                  <p className="text-sm text-muted-foreground">
                    {JSON.stringify(listing.accommodation)}
                  </p>
                </section>
              ) : null}

              <GuideCard guide={guide} />
            </TabsContent>

            {/* ─── Программа ────────────────────────────────────────── */}
            <TabsContent value="program" className="mt-6 flex flex-col gap-6">
              <TourItineraryDisplay days={days} />

              {mealDays.length > 0 ? (
                <section className="flex flex-col gap-3">
                  <h2 className="text-lg font-semibold tracking-tight">Питание</h2>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/40 text-left">
                          <th className="px-3 py-2 font-medium">День</th>
                          {["breakfast", "lunch", "dinner"].map((mt) => (
                            <th key={mt} className="px-3 py-2 font-medium">
                              {MEAL_TYPE_LABELS[mt]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {mealDays.map((dayNum) => {
                          const row = meals.filter((m) => m.day_number === dayNum);
                          return (
                            <tr key={dayNum} className="border-b border-border last:border-0">
                              <td className="px-3 py-2 font-medium">День {dayNum}</td>
                              {(["breakfast", "lunch", "dinner"] as const).map((mt) => {
                                const m = row.find((x) => x.meal_type === mt);
                                return (
                                  <td key={mt} className="px-3 py-2 text-muted-foreground">
                                    {m ? (MEAL_STATUS_LABELS[m.status] ?? m.status) : "—"}
                                    {m?.note ? ` (${m.note})` : ""}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              ) : null}
            </TabsContent>

            {/* ─── Даты и цены ──────────────────────────────────────── */}
            <TabsContent value="dates" className="mt-6 flex flex-col gap-6">
              <TourDeparturesList departures={departures} />
              <TariffsList
                tariffs={tariffs}
                priceFromMinor={listing.price_from_minor}
                defaultCurrency={listing.currency}
                format={listing.format}
                maxGroupSize={listing.max_group_size}
              />
            </TabsContent>
          </Tabs>
        </div>

        <aside className="hidden w-full shrink-0 md:block md:w-80 lg:sticky lg:top-24 lg:self-start">
          {bookingCard}
        </aside>
      </div>

      {/* Mobile sticky CTA */}
      <StickyActionBar
        className="md:hidden"
        avatarUrl={coverUrl}
        name={listing.title}
        metaLabel={priceLabel}
        primary={
          <Button asChild className="shrink-0">
            <Link href={`/listings/${listing.id}/book`}>Заказать</Link>
          </Button>
        }
      />

      <Separator className="my-8" />
      <TransferCrossSellWidget region={listing.region} currentListingId={listing.id} />
    </div>
  );
}
