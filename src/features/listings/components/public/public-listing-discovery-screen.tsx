"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Compass, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListHero } from "@/components/shared/list-hero";
import { ListingCard } from "@/components/shared/listing-card";
import { cn } from "@/lib/utils";
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
    guideName: listing.guideName ?? "Локальный гид",
    guideAvatarUrl: listing.guideAvatarUrl,
    guideHomeBase: listing.city,
    rating: listing.rating ?? 0,
    reviewCount: listing.reviewCount ?? 0,
    status: "active",
  };
}

function pillClass(isActive: boolean): string {
  return cn(
    "inline-flex h-10 cursor-pointer items-center gap-2 rounded-full px-5 text-[0.9rem] transition-colors",
    isActive
      ? "bg-primary font-semibold text-primary-foreground"
      : "bg-surface-low font-medium text-on-surface-muted hover:bg-surface",
  );
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

  const themeCounts = useMemo(() => {
    const counts = {} as Record<ThemeSlug, number>;
    for (const theme of THEMES) {
      counts[theme.slug] = listings.filter((listing) =>
        listing.themes.includes(theme.slug),
      ).length;
    }
    return counts;
  }, [listings]);

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
      <ListHero
        imageUrl="https://images.unsplash.com/photo-1513326738677-b964603b136d?auto=format&fit=crop&w=1600&h=1200&q=80"
        title="Готовые экскурсии"
        intro="Авторские экскурсии от местных гидов."
      >
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-on-surface-muted"
            aria-hidden
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по названию, описанию или направлению…"
            aria-label="Поиск по экскурсиям"
            className="h-12 rounded-[12px] border-transparent bg-surface pl-11 text-on-surface shadow-lg"
          />
        </div>
      </ListHero>

      <div className="flex flex-wrap gap-3">
        <button
          key="all"
          type="button"
          onClick={() => setActiveFilter("all")}
          className={pillClass(activeFilter === "all")}
        >
          Все
          <span className="tabular-nums opacity-60">{listings.length}</span>
        </button>
        {THEMES.map(({ slug, label, Icon }) => (
          <button
            key={slug}
            type="button"
            onClick={() => setActiveFilter(slug)}
            className={pillClass(activeFilter === slug)}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {label}
            <span className="tabular-nums opacity-60">{themeCounts[slug]}</span>
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
        <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-border bg-surface-lowest px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Compass className="size-6" strokeWidth={1.9} />
          </span>
          <h2 className="mt-5 text-[1.35rem] font-semibold text-on-surface">
            Маршруты не найдены
          </h2>
          <p className="mt-2 max-w-[30rem] text-[0.95rem] leading-7 text-on-surface-muted">
            Не нашли подходящую экскурсию? Опубликуйте запрос — гиды предложат маршрут под вас.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link href="/">Опубликовать запрос</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearch("");
                setActiveFilter("all");
              }}
            >
              Сбросить
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
