import Image from "next/image";
import Link from "next/link";

import { RatingDisplay } from "@/components/shared/rating-display";
import type { ListingRecord } from "@/data/supabase/queries";

type ListingCardProps = {
  listing: ListingRecord;
};

export function ListingCard({ listing }: ListingCardProps) {
  return (
    <Link
      href={`/listings/${listing.slug}`}
      className="group relative block min-h-[360px] overflow-hidden rounded-[1.75rem] bg-ink"
    >
      <Image
        src={listing.imageUrl}
        alt={listing.title}
        fill
        sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(15,23,42,0.82),rgba(15,23,42,0.12)_60%)]" />
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-3 p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
          {listing.destinationName} · {listing.durationLabel}
        </p>
        <h3 className="max-w-xs text-[2rem] font-semibold leading-[1.02] text-white">{listing.title}</h3>
        <p className="max-w-sm text-sm leading-[1.55] text-white/78">{listing.description}</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-white/88">{listing.guideName}</p>
            <RatingDisplay
              rating={listing.rating}
              reviewCount={listing.reviewCount}
              className="flex items-center gap-2 text-sm text-white/72"
            />
          </div>
          <span className="rounded-full bg-white/14 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md">
            от {new Intl.NumberFormat("ru-RU").format(listing.priceRub)} ₽
          </span>
        </div>
      </div>
    </Link>
  );
}
