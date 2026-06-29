"use client";

import * as React from "react";

import {
  DiscoveryFacetChip,
  DiscoveryFacetRail,
  DiscoveryHero,
  DiscoveryResultsCount,
  DiscoveryShell,
  DiscoveryToolbar,
} from "@/components/shared/discovery-shell";
import { DiscoverySearchInput } from "@/components/shared/discovery-search-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DestinationsGrid,
  DESTINATION_CATEGORY_LABELS,
} from "@/features/destinations/components/destinations-grid";
import type { DestinationCategory, DestinationRecord } from "@/data/supabase/queries";

const DESTINATION_CATEGORY_ORDER: readonly DestinationCategory[] = ["city", "nature", "culture"];

/**
 * Discovery screen for `/destinations`. Owns the hero + search + results in one
 * client component so the page follows the same grammar as `/requests`,
 * `/listings` and `/guides`: search lives in the hero slot, results sit in the
 * shared shell below.
 */
export function DestinationsDiscoveryScreen({
  destinations,
  loadError = false,
}: {
  destinations: DestinationRecord[];
  loadError?: boolean;
}) {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<DestinationCategory | "all">("all");

  const categoryCounts = React.useMemo(() => {
    const counts = { city: 0, nature: 0, culture: 0 } as Record<DestinationCategory, number>;
    for (const dest of destinations) counts[dest.category] += 1;
    return counts;
  }, [destinations]);

  const visibleCount = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return destinations.filter((d) => {
      if (category !== "all" && d.category !== category) return false;
      if (!q) return true;
      return `${d.name} ${d.region ?? ""} ${d.description ?? ""}`.toLowerCase().includes(q);
    }).length;
  }, [destinations, query, category]);

  return (
    <>
      <DiscoveryHero
        imageUrl="/hero-valley.jpg"
        imagePosition="center 50%"
        title="Направления"
        intro="Откройте города и регионы России — и найдите местного гида в каждом из них."
      >
        <DiscoverySearchInput
          id="dest-search"
          label="Поиск направления"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск по городу, региону или описанию"
        />
      </DiscoveryHero>

      {!loadError && destinations.length > 0 ? (
        <DiscoveryToolbar
          facets={
            <DiscoveryFacetRail label="Категории направлений">
              <DiscoveryFacetChip
                active={category === "all"}
                count={destinations.length}
                onClick={() => setCategory("all")}
              >
                Все
              </DiscoveryFacetChip>
              {DESTINATION_CATEGORY_ORDER.filter((slug) => categoryCounts[slug] > 0).map((slug) => (
                <DiscoveryFacetChip
                  key={slug}
                  active={category === slug}
                  count={categoryCounts[slug]}
                  onClick={() => setCategory(slug)}
                >
                  {DESTINATION_CATEGORY_LABELS[slug]}
                </DiscoveryFacetChip>
              ))}
            </DiscoveryFacetRail>
          }
          count={
            <DiscoveryResultsCount
              count={visibleCount}
              noun={["направление", "направления", "направлений"]}
            />
          }
        />
      ) : null}

      <DiscoveryShell>
        {loadError ? (
          <Alert variant="destructive">
            <AlertDescription>
              Не удалось загрузить направления. Попробуйте обновить страницу.
            </AlertDescription>
          </Alert>
        ) : (
          <DestinationsGrid destinations={destinations} query={query} category={category} />
        )}
      </DiscoveryShell>
    </>
  );
}
