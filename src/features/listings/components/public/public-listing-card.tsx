import Link from "next/link";

import { Clock3, Star, Users } from "lucide-react";

import { FavoriteToggle } from "@/components/shared/favorite-toggle";
import { PriceScenarios } from "@/components/shared/price-scenarios";
import { TransportOptionPill } from "@/components/shared/transport-option-pill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PublicListing } from "@/data/public-listings/types";
import { getListingQualitySnapshot } from "@/data/quality/seed";
import { ListingCoverArt } from "@/features/listings/components/public/listing-cover-art";

function formatRub(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

export function PublicListingCard({ listing }: { listing: PublicListing }) {
  const quality = getListingQualitySnapshot(listing.slug);

  return (
    <article className="glass-panel overflow-hidden rounded-[2rem] border border-white/70">
      <div className="relative">
        <ListingCoverArt listing={listing} compact />
        <div className="absolute right-4 top-4">
          <FavoriteToggle
            targetType="listing"
            slug={listing.slug}
            label={`Сохранить экскурсию ${listing.title}`}
            className="border-white/16 bg-black/20 text-white hover:bg-black/30"
          />
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full px-3">
            <Star className="mr-1 size-3.5 fill-current" />
            4.8
          </Badge>
          <Badge variant="outline" className="rounded-full px-3">
            <Clock3 className="mr-1 size-3.5" />
            Ответ в среднем {quality.responseTimeHours.toFixed(1)} ч
          </Badge>
          <Badge variant="outline" className="rounded-full px-3">
            <Users className="mr-1 size-3.5" />
            До {listing.groupSizeMax} человек
          </Badge>
        </div>

        <div className="space-y-3">
          <p className="text-sm leading-7 text-muted-foreground">
            {listing.highlights[0]}
          </p>
          {listing.transportOptions?.length ? (
            <div className="flex flex-wrap gap-2">
              {listing.transportOptions.map((option) => (
                <TransportOptionPill
                  key={`${listing.slug}-${option.mode}-${option.label}`}
                  option={option}
                />
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {listing.themes.map((theme) => (
              <span
                key={theme}
                className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-end justify-between gap-4 border-t border-border/70 pt-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Цена
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              {formatRub(listing.priceFromRub)}
            </p>
            <p className="text-sm text-muted-foreground">за маршрут от гида</p>
          </div>
          <Button asChild className="rounded-full px-5">
            <Link href={`/listings/${listing.slug}`}>Смотреть программу</Link>
          </Button>
        </div>

        {listing.priceScenarios?.length ? (
          <PriceScenarios scenarios={listing.priceScenarios.slice(0, 2)} />
        ) : null}
      </div>
    </article>
  );
}
