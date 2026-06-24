import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRubNumber } from "@/data/money";
import type { ListingRecord } from "@/data/supabase/queries";
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
  const showRating = listing.rating > 0;
  const showReviews = listing.reviewCount > 0;

  return (
    <Link
      href={`/listings/${listing.slug}`}
      className="group relative block overflow-hidden rounded-[16px] border border-[rgba(20,28,40,.08)] bg-card shadow-[0_1px_2px_rgba(20,28,40,.04)] transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-[3px] hover:shadow-[0_20px_38px_-22px_rgba(20,28,40,.42)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            {fmtLabel ? (
              <span className="rounded-full bg-[rgba(8,14,24,.58)] px-[9px] py-[4px] text-[11px] font-semibold text-white backdrop-blur-[4px]">
                {fmtLabel}
              </span>
            ) : null}
            {listing.durationLabel ? (
              <span className="rounded-full bg-[rgba(8,14,24,.58)] px-[9px] py-[4px] text-[11px] font-semibold text-white backdrop-blur-[4px]">
                {listing.durationLabel}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 p-5">
        <h3 className="text-[1.1rem] font-bold leading-[1.2] tracking-[-0.02em] text-on-surface line-clamp-2">
          {listing.title}
        </h3>

        <div className="flex items-center gap-2">
          <Avatar className="size-8 rounded-full">
            {listing.guideAvatarUrl ? (
              <AvatarImage src={listing.guideAvatarUrl} alt={listing.guideName} />
            ) : null}
            <AvatarFallback>{listing.guideName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-[13px] font-medium text-on-surface-muted line-clamp-1">
            {listing.guideName}
          </span>
        </div>

        {showRating ? (
          <div className="flex items-center gap-1.5 text-[13px] text-on-surface-muted">
            <Star className="size-[14px] fill-[var(--gold)] text-[var(--gold)]" />
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

        <div className="mt-auto flex items-baseline gap-2 border-t border-[rgba(20,28,40,.07)] pt-3">
          <span className="text-[1.05rem] font-bold text-on-surface">
            от {formatRubNumber(listing.priceRub)} ₽
          </span>
          <span className="text-[13px] text-on-surface-muted">с человека</span>
        </div>
      </div>
    </Link>
  );
}
