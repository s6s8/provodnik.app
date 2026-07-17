import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { rubToKopecks } from "@/data/money";
import type { ListingRecord } from "@/data/supabase/queries";
import { formatExcursionPriceFrom } from "@/components/listing-detail/excursion-price";
import { pluralize } from "@/lib/utils";

function getFormatLabel(format: string): string {
  if (format === "private") return "Индивидуальный";
  if (format === "group") return "Групповой";
  if (format === "combo") return "Группа / Инд.";
  return "";
}

type ListingCardProps = {
  listing: ListingRecord;
  priority?: boolean;
};

export function ListingCard({ listing, priority }: ListingCardProps) {
  const fmtLabel = getFormatLabel(listing.format);
  const priceLabel = formatExcursionPriceFrom(
    rubToKopecks(listing.priceRub),
    listing.format,
    listing.groupSize,
  );
  const showRating = listing.rating > 0;
  const showReviews = listing.reviewCount > 0;

  return (
    <Link
      // Templates adapted from guide_templates have no /listings detail route and
      // carry their own href (their guide's profile). See ListingRecord.detailHref.
      href={listing.detailHref ?? `/listings/${listing.slug}`}
      className="group relative block overflow-hidden rounded-card border border-border bg-card shadow-soft transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-[3px] hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <Image
          src={listing.imageUrl}
          alt={listing.title}
          fill
          priority={priority}
          fetchPriority={priority ? "high" : "auto"}
          sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {fmtLabel || listing.durationLabel ? (
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
            {fmtLabel ? <Badge variant="overlay">{fmtLabel}</Badge> : null}
            {listing.durationLabel ? (
              <Badge variant="overlay">{listing.durationLabel}</Badge>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 p-5">
        <h3 className="text-lg font-bold leading-[1.2] tracking-[-0.02em] text-on-surface line-clamp-2">
          {listing.title}
        </h3>

        <div className="flex items-center gap-2">
          <Avatar className="size-8 rounded-full">
            {listing.guideAvatarUrl ? (
              <AvatarImage src={listing.guideAvatarUrl} alt={listing.guideName} />
            ) : null}
            <AvatarFallback>{listing.guideName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-on-surface-muted line-clamp-1">
            {listing.guideName}
          </span>
        </div>

        {showRating ? (
          <div className="flex items-center gap-1.5 text-sm text-on-surface-muted">
            <Star className="size-3.5 fill-gold text-gold" />
            <span className="font-semibold text-on-surface">
              {listing.rating.toLocaleString("ru-RU", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
            </span>
            {showReviews ? (
              <span>
                · {listing.reviewCount}{" "}
                {pluralize(listing.reviewCount, "отзыв", "отзыва", "отзывов")}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto border-t border-border pt-3">
          <span className="text-base font-bold text-on-surface">{priceLabel}</span>
        </div>
      </div>
    </Link>
  );
}
