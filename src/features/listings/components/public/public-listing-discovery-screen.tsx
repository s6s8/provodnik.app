"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DiscoveryFacetChip,
  DiscoveryFacetRail,
  DiscoveryGrid,
  DiscoveryHero,
  DiscoveryResultsCount,
  DiscoveryShell,
  DiscoveryToolbar,
} from "@/components/shared/discovery-shell";
import { DiscoverySearchInput } from "@/components/shared/discovery-search-input";
import { ListingCard } from "@/components/shared/listing-card";
import { brandGradient } from "@/lib/city-image";
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
    imageUrl: listing.coverImageUrl ?? brandGradient(listing.title ?? "listing"),
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
    <>
      <DiscoveryHero
        imageUrl={brandGradient("listings")}
        title="Экскурсии"
        intro="Авторские экскурсии от местных гидов."
      >
        <DiscoverySearchInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск по названию, описанию или направлению…"
          aria-label="Поиск по экскурсиям"
        />
      </DiscoveryHero>

      <DiscoveryToolbar
        facets={
          <DiscoveryFacetRail label="Темы экскурсий">
            <DiscoveryFacetChip
              active={activeFilter === "all"}
              count={listings.length}
              onClick={() => setActiveFilter("all")}
            >
              Все
            </DiscoveryFacetChip>
            {THEMES.filter(({ slug }) => themeCounts[slug] > 0).map(({ slug, label, Icon }) => (
              <DiscoveryFacetChip
                key={slug}
                icon={Icon}
                active={activeFilter === slug}
                count={themeCounts[slug]}
                onClick={() => setActiveFilter(slug)}
              >
                {label}
              </DiscoveryFacetChip>
            ))}
          </DiscoveryFacetRail>
        }
        count={
          <DiscoveryResultsCount
            count={filteredListings.length}
            noun={["экскурсия", "экскурсии", "экскурсий"]}
          />
        }
      />

      <DiscoveryShell>
        {filteredListings.length > 0 ? (
          <DiscoveryGrid>
            {filteredListings.map((listing, index) => (
              <ListingCard
                key={listing.slug}
                listing={mapListing(listing)}
                priority={index === 0}
              />
            ))}
          </DiscoveryGrid>
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
      </DiscoveryShell>
    </>
  );
}
