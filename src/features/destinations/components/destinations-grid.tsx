"use client";

import * as React from "react";
import { Compass, SearchX } from "lucide-react";

import type { DestinationCategory, DestinationRecord } from "@/data/supabase/queries";
import { DestinationCard } from "@/components/discovery/DestinationCard";
import { DiscoveryGrid } from "@/components/shared/discovery-shell";
import { EmptyState } from "@/components/shared/empty-state";

/** Russian labels for the place-index categories shown on cards and facets. */
export const DESTINATION_CATEGORY_LABELS: Record<DestinationCategory, string> = {
  city: "Город",
  nature: "Природа",
  culture: "Культура",
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function DestinationsGrid({
  destinations,
  query = "",
  category = "all",
}: {
  destinations: DestinationRecord[];
  /** Search text owned by the discovery hero; filters the rendered cards. */
  query?: string;
  /** Active category facet owned by the toolbar; "all" shows every category. */
  category?: DestinationCategory | "all";
}) {
  const filtered = React.useMemo(() => {
    const q = normalize(query);
    return destinations.filter((d) => {
      if (category !== "all" && d.category !== category) return false;
      if (!q) return true;
      const haystack = `${d.name} ${d.region ?? ""} ${d.description ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [destinations, query, category]);

  if (destinations.length === 0) {
    return (
      <EmptyState
        icon={<Compass className="size-7" />}
        title="Пока нет доступных направлений"
        description="Загляните позже — мы добавляем новые города и регионы."
      />
    );
  }

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={<SearchX className="size-7" />}
        title="Ничего не найдено"
        description="Попробуйте другой запрос или снимите фильтр категории."
      />
    );
  }

  return (
    <DiscoveryGrid>
      {filtered.map((d, index) => (
        <DestinationCard
          key={d.slug}
          name={d.name}
          slug={d.slug}
          photoUrl={d.heroImageUrl}
          guidesCount={d.guidesCount}
          tourCount={d.listingCount}
          category={DESTINATION_CATEGORY_LABELS[d.category]}
          rating={d.avgRating}
          featured={index === 0}
        />
      ))}
    </DiscoveryGrid>
  );
}
