import Link from "next/link";

import { TransferCrossSellWidget } from "@/features/listings/components/TransferCrossSellWidget";
import { GuideCard } from "@/components/listing-detail/GuideCard";
import { PhotoGallery } from "@/components/listing-detail/PhotoGallery";
import { TariffsList } from "@/components/listing-detail/TariffsList";
import { TourDeparturesList } from "@/components/listing-detail/TourDeparturesList";
import { TourItineraryDisplay } from "@/components/listing-detail/TourItineraryDisplay";
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
  return new Intl.NumberFormat("ru-RU").format(Math.round(minor / 100));
}

type GuidePickProps = Pick<
  GuideProfileRow,
  | "user_id"
  | "slug"
  | "display_name"
  | "bio"
  | "average_rating"
  | "review_count"
  | "contact_visibility_unlocked"
  | "is_tour_operator"
> | null;

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
  photos,
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

  const bookingCard = (
    <div className="rounded-[28px] border border-glass-border bg-glass p-5 shadow-glass backdrop-blur-[20px] space-y-4">
      <div>
        <p className="text-3xl font-semibold">от {formatRubMinor(listing.price_from_minor)} ₽</p>
        <p className="text-sm text-muted-foreground">на человека</p>
      </div>
      <Button asChild className="w-full">
        <Link href={`/listings/${listing.id}/book`}>Заказать тур</Link>
      </Button>
      <Button asChild variant="outline" className="w-full">
        <Link href={`/listings/${listing.id}/book?tab=question`}>Задать вопрос</Link>
      </Button>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)] pb-28 pt-6 md:pb-12">
      <h1 className="mb-4 text-3xl font-semibold tracking-tight md:text-4xl">{listing.title}</h1>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge variant="outline">Тур</Badge>
        {difficultyLabel ? <Badge variant="secondary">{difficultyLabel}</Badge> : null}
        {guide?.is_tour_operator ? (
          <Badge variant="outline" className="border-primary/40 text-primary">
            Туроператор
          </Badge>
        ) : null}
        <span className="text-sm text-muted-foreground">
          ★ {listing.average_rating.toFixed(1)} · {listing.review_count} отзывов
        </span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0 space-y-8">
          <Tabs defaultValue="description">
            <TabsList className="w-full">
              <TabsTrigger value="description" className="flex-1">Описание</TabsTrigger>
              <TabsTrigger value="program" className="flex-1">Программа</TabsTrigger>
              <TabsTrigger value="dates" className="flex-1">Даты и цены</TabsTrigger>
            </TabsList>

            {/* ─── Описание ─────────────────────────────────────────── */}
            <TabsContent value="description" className="mt-6 space-y-6">
              <PhotoGallery photos={photos} coverUrl={coverUrl} />

              {description ? (
                <section className="space-y-2">
                  <h2 className="text-lg font-semibold tracking-tight">Описание</h2>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                    {description}
                  </p>
                </section>
              ) : null}

              {listing.included.length > 0 ? (
                <section className="space-y-2">
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
                <section className="space-y-2">
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
                <section className="space-y-2">
                  <h2 className="text-lg font-semibold tracking-tight">Проживание</h2>
                  <p className="text-sm text-muted-foreground">
                    {JSON.stringify(listing.accommodation)}
                  </p>
                </section>
              ) : null}

              <GuideCard guide={guide} />
            </TabsContent>

            {/* ─── Программа ────────────────────────────────────────── */}
            <TabsContent value="program" className="mt-6 space-y-6">
              <TourItineraryDisplay days={days} />

              {mealDays.length > 0 ? (
                <section className="space-y-3">
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
            <TabsContent value="dates" className="mt-6 space-y-6">
              <TourDeparturesList departures={departures} />
              <TariffsList
                tariffs={tariffs}
                priceFromMinor={listing.price_from_minor}
                defaultCurrency={listing.currency}
              />
            </TabsContent>
          </Tabs>
        </div>

        <aside className="hidden w-full shrink-0 md:block md:w-80 lg:sticky lg:top-24 lg:self-start">
          {bookingCard}
        </aside>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-page items-center justify-between gap-3 px-[clamp(12px,3vw,24px)]">
          <p className="text-lg font-semibold">от {formatRubMinor(listing.price_from_minor)} ₽</p>
          <Button asChild className="shrink-0">
            <Link href={`/listings/${listing.id}/book`}>Заказать</Link>
          </Button>
        </div>
      </div>

      <Separator className="my-8" />
      <TransferCrossSellWidget region={listing.region} currentListingId={listing.id} />
    </div>
  );
}
