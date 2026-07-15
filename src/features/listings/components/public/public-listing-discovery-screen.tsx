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
import { EmptyState } from "@/components/shared/empty-state";
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
    format: listing.format ?? "",
    category: listing.themes[0] ?? "",
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
          <EmptyState
            icon={<Compass className="size-6" />}
            title="Маршруты не найдены"
            description="Сбросьте фильтры или опубликуйте запрос — гиды предложат маршрут под вас."
            action={
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setActiveFilter("all");
                  }}
                >
                  Сбросить фильтры
                </Button>
                <Button asChild>
                  <Link href="/">Опубликовать запрос</Link>
                </Button>
              </>
            }
          />
        )}
      </DiscoveryShell>
    </>
  );
}
