"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Compass } from "lucide-react";

import { Input } from "@/components/ui/input";
import { ListingCard } from "@/components/shared/listing-card";
import type { ListingRecord } from "@/data/supabase/queries";
import type { PublicListing } from "@/data/public-listings/types";
import { THEMES, type ThemeSlug } from "@/data/themes";

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
    rating: 0,
    reviewCount: 0,
    status: "active",
  };
}

export function PublicListingDiscoveryScreen({
  listings,
  initialSearch = "",
}: {
  listings: readonly PublicListing[];
  initialSearch?: string;
}) {
  const [activeFilter, setActiveFilter] = useState<"all" | ThemeSlug>("all");
  const [search, setSearch] = useState(initialSearch);

  const filteredListings = useMemo(() => {
    const themeFiltered =
      activeFilter === "all"
        ? listings
        : listings.filter((listing) => listing.themes.includes(activeFilter));

    const query = search.trim().toLowerCase();
    if (!query) return themeFiltered;

    return themeFiltered.filter((listing) => {
      const haystack = [
        listing.title,
        listing.highlights.join(" "),
        listing.city,
        listing.region,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [activeFilter, listings, search]);

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <p className="text-[0.6875rem] font-medium tracking-[0.18em] uppercase text-muted-foreground">
          Экскурсии
        </p>
        <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-semibold leading-[1.05] text-ink">
          Маршруты с локальными гидами
        </h1>
        <p className="max-w-[48rem] text-[1rem] leading-[1.65] text-ink-2">
          Подборка авторских маршрутов по городам и природным направлениям России с понятным темпом, стоимостью и форматом группы.
        </p>
      </section>

      <div className="max-w-[32rem]">
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск по названию, описанию или направлению…"
          aria-label="Поиск по турам"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          key="all"
          type="button"
          onClick={() => setActiveFilter("all")}
          className={
            activeFilter === "all"
              ? "inline-flex h-10 cursor-pointer items-center justify-center rounded-full bg-brand px-5 text-[0.9rem] font-semibold text-white shadow-[0_8px_24px_rgba(0,88,190,0.28)]"
              : "inline-flex h-10 cursor-pointer items-center justify-center rounded-full bg-surface-low px-5 text-[0.9rem] font-medium text-ink-2 transition-colors hover:bg-brand/10 hover:text-brand"
          }
        >
          Все
        </button>
        {THEMES.map(({ slug, label, Icon }) => (
          <button
            key={slug}
            type="button"
            onClick={() => setActiveFilter(slug)}
            className={
              activeFilter === slug
                ? "inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-brand px-5 text-[0.9rem] font-semibold text-white shadow-[0_8px_24px_rgba(0,88,190,0.28)]"
                : "inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-surface-low px-5 text-[0.9rem] font-medium text-ink-2 transition-colors hover:bg-brand/10 hover:text-brand"
            }
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {filteredListings.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredListings.map((listing, index) => (
            <ListingCard
              key={listing.slug}
              listing={mapListing(listing)}
              priority={index === 0}
            />
          ))}
        </div>
      ) : (
        <div className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass flex flex-col items-center justify-center rounded-[1.5rem] px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-brand-light text-brand">
            <Compass className="size-6" strokeWidth={1.9} />
          </span>
          <h2 className="mt-5 text-[1.35rem] font-semibold text-ink">Маршруты не найдены</h2>
          <p className="mt-2 max-w-[30rem] text-[0.95rem] leading-7 text-ink-2">
            Попробуйте другой фильтр или создайте запрос на индивидуальный маршрут.
          </p>
          <Link
            href="/requests/new"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-brand px-6 text-[0.9rem] font-semibold text-white shadow-[0_8px_24px_rgba(0,88,190,0.28)]"
          >
            Создать запрос
          </Link>
        </div>
      )}
    </div>
  );
}
