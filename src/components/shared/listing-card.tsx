import Image from "next/image";
import Link from "next/link";

import type { ListingRecord } from "@/data/supabase/queries";

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

  return (
    <Link
      href={`/listings/${listing.slug}`}
      className="group relative block min-h-[360px] overflow-hidden rounded-[1.75rem] bg-ink"
    >
      <Image
        src={listing.imageUrl}
        alt={listing.title}
        fill
        priority={priority}
        fetchPriority={priority ? "high" : "auto"}
        sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-foreground/10" />
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 p-6 text-primary-foreground">
        {/* Chips row */}
        <div className="flex flex-wrap gap-1.5">
          {fmtLabel ? (
            <span className="inline-flex items-center rounded-full bg-primary-foreground/15 px-2.5 py-0.5 text-[0.6875rem] font-medium text-primary-foreground/85 backdrop-blur-sm">
              {fmtLabel}
            </span>
          ) : null}
          {listing.durationLabel ? (
            <span className="inline-flex items-center rounded-full bg-primary-foreground/15 px-2.5 py-0.5 text-[0.6875rem] font-medium text-primary-foreground/85 backdrop-blur-sm">
              {listing.durationLabel}
            </span>
          ) : null}
        </div>

        {/* Title */}
        <h3 className="max-w-xs text-[2rem] font-semibold leading-[1.02] text-primary-foreground">
          {listing.title}
        </h3>

        {/* Description */}
        <p className="max-w-sm text-sm leading-[1.55] text-primary-foreground/80 line-clamp-2">
          {listing.description}
        </p>

        {/* Bottom row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-primary-foreground/90">{listing.guideName}</p>
            {listing.rating > 0 ? (
              <p className="text-xs text-primary-foreground/70">
                ★ {listing.rating.toFixed(1)} · {listing.reviewCount} отзывов
              </p>
            ) : null}
          </div>
          <span className="rounded-full bg-primary-foreground/15 px-4 py-2 text-sm font-semibold text-primary-foreground backdrop-blur-md">
            от {new Intl.NumberFormat("ru-RU").format(listing.priceRub)} ₽
          </span>
        </div>
      </div>
    </Link>
  );
}
