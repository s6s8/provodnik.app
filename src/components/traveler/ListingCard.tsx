import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ListingRow } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const EXP_TYPE_LABELS: Record<NonNullable<ListingRow["exp_type"]>, string> = {
  excursion: "Экскурсия",
  waterwalk: "Прогулка на воде",
  masterclass: "Мастер-класс",
  photosession: "Фотосессия",
  quest: "Квест",
  activity: "Активность",
  tour: "Тур",
  transfer: "Трансфер",
};

function formatPriceFromMinor(minor: number): string {
  const rub = minor / 100;
  return `от ${new Intl.NumberFormat("ru-RU").format(rub)} ₽`;
}

function formatDuration(minutes: number | null): string {
  if (minutes == null || minutes <= 0) return "";
  if (minutes < 60) return `${minutes} мин`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
}

interface Props {
  listing: Pick<
    ListingRow,
    | "id"
    | "title"
    | "region"
    | "city"
    | "exp_type"
    | "price_from_minor"
    | "duration_minutes"
    | "average_rating"
    | "image_url"
  >;
}

export function ListingCard({ listing }: Props) {
  const durationLabel = formatDuration(listing.duration_minutes);
  const location = [listing.region, listing.city].filter(Boolean).join(", ");

  return (
    <Link
      className="group block rounded-glass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      href={`/listings/${listing.id}`}
    >
      <Card className="h-full gap-0 py-0 transition-shadow group-hover:shadow-md">
        <div
          className={cn(
            "relative aspect-[4/3] w-full overflow-hidden rounded-t-glass",
            !listing.image_url &&
              "bg-gradient-to-br from-surface-high to-border",
          )}
        >
          {listing.image_url ? (
            <img
              alt=""
              className="size-full object-cover"
              src={listing.image_url}
            />
          ) : null}
        </div>
        <CardContent className="flex flex-col gap-2 px-4 pb-4 pt-3">
          {listing.exp_type ? (
            <Badge className="w-fit normal-case tracking-normal" variant="secondary">
              {EXP_TYPE_LABELS[listing.exp_type]}
            </Badge>
          ) : null}
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground">
            {listing.title}
          </h3>
          {location ? (
            <p className="line-clamp-1 text-sm text-muted-foreground">{location}</p>
          ) : null}
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-foreground">
            <span className="font-medium">{formatPriceFromMinor(listing.price_from_minor)}</span>
            {durationLabel ? (
              <span className="text-muted-foreground">{durationLabel}</span>
            ) : null}
          </div>
          {listing.average_rating > 0 ? (
            <p className="text-sm text-muted-foreground">
              ★ {listing.average_rating.toFixed(1)}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
