"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Compass } from "lucide-react";

import { ListingCard } from "@/components/shared/listing-card";
import type { ListingRecord } from "@/data/supabase/queries";
import type { PublicListing, PublicListingTheme } from "@/data/public-listings/types";

const filters = ["Все", "Природа", "История", "С семьёй", "Фотография"] as const;
const filterThemeMap: Partial<Record<(typeof filters)[number], PublicListingTheme>> = {
  Природа: "Природа",
  История: "История",
  "С семьёй": "С семьей",
  Фотография: "Фотография",
};

function mapListing(listing: PublicListing): ListingRecord {
  return {
    id: listing.slug,
    slug: listing.slug,
    title: listing.title,
    destinationSlug: listing.city.toLowerCase().replaceAll(" ", "-"),
    destinationName: listing.city,
    destinationRegion: listing.region,
    imageUrl:
      listing.coverImageUrl ??
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&q=80",
    priceRub: listing.priceFromRub,
    durationDays: listing.durationDays,
    durationLabel: `${listing.durationDays} дн.`,
    groupSize: listing.groupSizeMax,
    difficulty: "Средняя",
    departure: listing.city,
    format: listing.themes[0] ?? "Маршрут",
    description: listing.highlights.join(". "),
    inclusions: [...listing.inclusions],
    exclusions: [],
    guideSlug: listing.guideSlug,
    guideName: "Локальный гид",
    guideHomeBase: listing.city,
    rating: 4.8,
    reviewCount: 0,
    status: "active",
  };
}

export function PublicListingDiscoveryScreen({
  listings,
}: {
  listings: readonly PublicListing[];
}) {
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("Все");

  const filteredListings = useMemo(() => {
    if (activeFilter === "Все") {
      return listings;
    }

    const theme = filterThemeMap[activeFilter];
    if (!theme) return listings;

    return listings.filter((listing) => listing.themes.includes(theme));
  }, [activeFilter, listings]);

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <p className="text-[0.6875rem] font-medium tracking-[0.18em] uppercase text-muted-foreground">
          Экскурсии
        </p>
        <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-semibold leading-[1.05] text-[var(--ink)]">
          Маршруты с локальными гидами
        </h1>
        <p className="max-w-[48rem] text-[1rem] leading-8 text-[var(--ink-2)]">
          Подборка авторских маршрутов по городам и природным направлениям России с понятным темпом, стоимостью и форматом группы.
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={
              activeFilter === filter
                ? "inline-flex h-10 items-center justify-center rounded-full bg-[var(--brand)] px-5 text-[0.9rem] font-semibold text-white shadow-[0_8px_24px_rgba(0,88,190,0.28)]"
                : "inline-flex h-10 items-center justify-center rounded-full bg-[var(--surface-low)] px-5 text-[0.9rem] font-medium text-[var(--ink-2)]"
            }
          >
            {filter}
          </button>
        ))}
      </div>

      {filteredListings.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredListings.map((listing) => (
            <ListingCard key={listing.slug} listing={mapListing(listing)} />
          ))}
        </div>
      ) : (
        <div className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass flex flex-col items-center justify-center rounded-[1.5rem] px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-[var(--brand-light)] text-[var(--brand)]">
            <Compass className="size-6" strokeWidth={1.9} />
          </span>
          <h2 className="mt-5 text-[1.35rem] font-semibold text-[var(--ink)]">Маршруты не найдены</h2>
          <p className="mt-2 max-w-[30rem] text-[0.95rem] leading-7 text-[var(--ink-2)]">
            Попробуйте другой фильтр или создайте запрос на индивидуальный маршрут.
          </p>
          <Link
            href="/requests/new"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[var(--brand)] px-6 text-[0.9rem] font-semibold text-white shadow-[0_8px_24px_rgba(0,88,190,0.28)]"
          >
            Создать запрос
          </Link>
        </div>
      )}
    </div>
  );
}
