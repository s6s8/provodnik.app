import { Star } from "lucide-react";
import Link from "next/link";

import { TransferCrossSellWidget } from "@/features/listings/components/TransferCrossSellWidget";
import { AvailabilitySection, type ListingSlotRow } from "@/components/listing-detail/AvailabilitySection";
import { BookingCard } from "@/components/listing-detail/BookingCard";
import { GuideCard } from "@/components/listing-detail/GuideCard";
import { ScheduleDisplay } from "@/components/listing-detail/ScheduleDisplay";
import { TariffsList } from "@/components/listing-detail/TariffsList";
import { ImmersiveHero } from "@/components/shared/immersive-hero";
import { StickyActionBar } from "@/components/shared/sticky-action-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type {
  GuideProfileRow,
  ListingPhotoRow,
  ListingRow,
  ListingScheduleRow,
  ListingTariffRow,
} from "@/lib/supabase/types";
import { maskPii } from "@/lib/pii/mask";
import { arrowizeRoute, pluralize } from "@/lib/utils";

import { formatExcursionPriceFrom } from "./excursion-price";

export type ListingDetailRow = ListingRow & { image_url?: string | null };

const EXP_TYPE_LABELS: Record<string, string> = {
  excursion: "Классическая экскурсия",
  waterwalk: "Прогулка на воде",
  masterclass: "Мастер-класс",
  photosession: "Фотосессия",
  quest: "Квест",
  activity: "Активность",
  tour: "Тур",
  transfer: "Трансфер",
};

const FORMAT_LABELS: Record<string, string> = {
  group: "Групповой",
  private: "Индивидуальный",
  combo: "Группа или индивидуально",
};

function formatDuration(minutes: number | null): string {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
}

interface Props {
  listing: ListingDetailRow;
  photos: ListingPhotoRow[];
  schedule: ListingScheduleRow[];
  slots: ListingSlotRow[];
  tariffs: ListingTariffRow[];
  guide: Pick<
    GuideProfileRow,
    | "user_id"
    | "slug"
    | "bio"
    | "average_rating"
    | "review_count"
    | "contact_visibility_unlocked"
    | "years_experience"
    | "specialties"
    | "languages"
    | "verification_status"
  > & { full_name?: string | null; avatar_url?: string | null } | null;
}

export function ExcursionShapeDetail({ listing, schedule, slots, tariffs, guide }: Props) {
  const description = maskPii(listing.description);
  const idea = maskPii(listing.idea);
  const routeText = arrowizeRoute(maskPii(listing.route));
  const theme = maskPii(listing.theme);
  const audience = maskPii(listing.audience);
  const facts = maskPii(listing.facts);

  const expLabel = listing.exp_type ? (EXP_TYPE_LABELS[listing.exp_type] ?? listing.exp_type) : "";
  const formatLabel = listing.format ? (FORMAT_LABELS[listing.format] ?? listing.format) : "";
  const durationLabel = formatDuration(listing.duration_minutes);

  const coverUrl = listing.image_url ?? null;
  const priceLabel = formatExcursionPriceFrom(
    listing.price_from_minor,
    listing.format,
    listing.max_group_size,
  );

  const bookingCard = (
    <BookingCard
      listingId={listing.id}
      priceLabel={priceLabel}
      rating={listing.average_rating}
      reviewCount={listing.review_count ?? 0}
      primaryLabel="Заказать"
      facts={[
        ...(durationLabel ? [`Длительность: ${durationLabel}`] : []),
        ...(formatLabel ? [`Формат: ${formatLabel}`] : []),
        `Группа до ${listing.max_group_size} чел.`,
      ]}
      notes={[
        "Отправьте запрос — гид пришлёт предложение с ценой и деталями",
        "Бронирование подтверждается предоплатой на платформе.",
        "Контакты гида откроются после принятия предложения",
      ]}
      instantBooking={Boolean(listing.instant_booking)}
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

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0 flex flex-col gap-8">
          <header className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {expLabel ? <Badge variant="outline">{expLabel}</Badge> : null}
              {formatLabel ? <Badge variant="secondary">{formatLabel}</Badge> : null}
              {durationLabel ? <Badge variant="outline">{durationLabel}</Badge> : null}
              {listing.review_count > 0 ? (
                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="size-3.5 fill-gold text-gold" /> {listing.average_rating.toFixed(1)} · {listing.review_count} {pluralize(listing.review_count, "отзыв", "отзыва", "отзывов")}
                </span>
              ) : null}
            </div>
          </header>

          {description ? (
            <section className="flex flex-col gap-2">
              <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{description}</p>
            </section>
          ) : null}

          {idea ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold tracking-tight">Идея</h2>
              <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{idea}</p>
            </section>
          ) : null}

          {routeText ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold tracking-tight">Маршрут</h2>
              <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{routeText}</p>
            </section>
          ) : null}

          {theme ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold tracking-tight">Тема</h2>
              <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{theme}</p>
            </section>
          ) : null}

          <TariffsList
            tariffs={tariffs}
            priceFromMinor={listing.price_from_minor}
            defaultCurrency={listing.currency}
            format={listing.format}
            maxGroupSize={listing.max_group_size}
          />

          <ScheduleDisplay schedule={schedule} />

          <AvailabilitySection slots={slots} />

          {audience ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold tracking-tight">Для кого</h2>
              <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{audience}</p>
            </section>
          ) : null}

          {facts ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold tracking-tight">Интересные факты</h2>
              <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{facts}</p>
            </section>
          ) : null}

          <Separator />

          <GuideCard guide={guide} />
        </div>

        <aside className="hidden w-full shrink-0 md:block md:w-80 lg:sticky lg:top-24 lg:self-start">
          {bookingCard}
        </aside>
      </div>

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
