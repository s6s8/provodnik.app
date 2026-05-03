import Link from "next/link";

import { TransferCrossSellWidget } from "@/features/listings/components/TransferCrossSellWidget";
import { GuideCard } from "@/components/listing-detail/GuideCard";
import { PhotoGallery } from "@/components/listing-detail/PhotoGallery";
import { ScheduleDisplay } from "@/components/listing-detail/ScheduleDisplay";
import { TariffsList } from "@/components/listing-detail/TariffsList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type {
  GuideProfileRow,
  ListingPhotoRow,
  ListingRow,
  ListingScheduleRow,
  ListingTariffRow,
} from "@/lib/supabase/types";
import { maskPii } from "@/lib/pii/mask";

export type ListingDetailRow = ListingRow & { image_url?: string | null };

const EXP_TYPE_LABELS: Record<string, string> = {
  excursion: "Экскурсия",
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

function formatRubMinor(minor: number): string {
  return new Intl.NumberFormat("ru-RU").format(Math.round(minor / 100));
}

interface Props {
  listing: ListingDetailRow;
  photos: ListingPhotoRow[];
  schedule: ListingScheduleRow[];
  tariffs: ListingTariffRow[];
  guide: Pick<
    GuideProfileRow,
    | "user_id"
    | "slug"
    | "display_name"
    | "bio"
    | "average_rating"
    | "review_count"
    | "contact_visibility_unlocked"
  > | null;
}

export function ExcursionShapeDetail({ listing, photos, schedule, tariffs, guide }: Props) {
  const description = maskPii(listing.description);
  const idea = maskPii(listing.idea);
  const routeText = maskPii(listing.route);
  const theme = maskPii(listing.theme);
  const audience = maskPii(listing.audience);
  const facts = maskPii(listing.facts);

  const expLabel = listing.exp_type ? (EXP_TYPE_LABELS[listing.exp_type] ?? listing.exp_type) : "";
  const formatLabel = listing.format ? (FORMAT_LABELS[listing.format] ?? listing.format) : "";
  const durationLabel = formatDuration(listing.duration_minutes);

  const coverUrl = listing.image_url ?? null;

  const bookingCard = (
    <Card className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass">
      <CardContent className="space-y-4 p-5">
        <div>
          <p className="text-3xl font-semibold">от {formatRubMinor(listing.price_from_minor)} ₽</p>
        </div>
        <ul className="space-y-1 text-sm text-muted-foreground">
          {durationLabel ? <li>Длительность: {durationLabel}</li> : null}
          {formatLabel ? <li>Формат: {formatLabel}</li> : null}
          <li>Группа до {listing.max_group_size} чел.</li>
        </ul>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li>Отправьте запрос — гид пришлёт предложение с ценой и деталями</li>
          <li>Оплата напрямую гиду при встрече. 0% комиссии.</li>
          <li>Контакты гида откроются после принятия предложения</li>
        </ul>
        {listing.instant_booking ? (
          <Badge variant="secondary">Мгновенное бронирование</Badge>
        ) : null}
        <div className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href={`/listings/${listing.id}/book`}>Заказать</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full text-sm">
            <Link href={`/listings/${listing.id}/book?tab=question`}>Задать вопрос</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)] pb-28 pt-6 md:pb-12">
      <PhotoGallery photos={photos} coverUrl={coverUrl} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0 space-y-8">
          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {expLabel ? <Badge variant="outline">{expLabel}</Badge> : null}
              {formatLabel ? <Badge variant="secondary">{formatLabel}</Badge> : null}
              {durationLabel ? <Badge variant="outline">{durationLabel}</Badge> : null}
              {listing.review_count > 0 ? (
                <span className="text-sm text-muted-foreground">
                  ★ {listing.average_rating.toFixed(1)} · {listing.review_count} отзывов
                </span>
              ) : null}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{listing.title}</h1>
          </header>

          {description ? (
            <section className="space-y-2">
              <h2 className="text-lg font-semibold tracking-tight">Описание</h2>
              <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{description}</p>
            </section>
          ) : null}

          {idea ? (
            <section className="space-y-2">
              <h2 className="text-lg font-semibold tracking-tight">Идея</h2>
              <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{idea}</p>
            </section>
          ) : null}

          {routeText ? (
            <section className="space-y-2">
              <h2 className="text-lg font-semibold tracking-tight">Маршрут</h2>
              <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{routeText}</p>
            </section>
          ) : null}

          {theme ? (
            <section className="space-y-2">
              <h2 className="text-lg font-semibold tracking-tight">Тема</h2>
              <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{theme}</p>
            </section>
          ) : null}

          <TariffsList
            tariffs={tariffs}
            priceFromMinor={listing.price_from_minor}
            defaultCurrency={listing.currency}
          />

          <ScheduleDisplay schedule={schedule} />

          {audience ? (
            <section className="space-y-2">
              <h2 className="text-lg font-semibold tracking-tight">Для кого</h2>
              <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{audience}</p>
            </section>
          ) : null}

          {facts ? (
            <section className="space-y-2">
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

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-page items-center justify-between gap-3 px-[clamp(12px,3vw,24px)]">
          <p className="text-lg font-semibold">от {formatRubMinor(listing.price_from_minor)} ₽</p>
          <Button asChild className="shrink-0">
            <Link href={`/listings/${listing.id}/book`}>
              Заказать
            </Link>
          </Button>
        </div>
      </div>

      <Separator className="my-8" />
      <TransferCrossSellWidget region={listing.region} currentListingId={listing.id} />
    </div>
  );
}
