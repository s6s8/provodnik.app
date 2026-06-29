"use client";

import * as React from "react";
import { Compass } from "lucide-react";

import type { DestinationRecord } from "@/data/supabase/queries";
import { DestinationCard } from "@/components/discovery/DestinationCard";
import { DiscoveryGrid } from "@/components/shared/discovery-shell";
import { EmptyState } from "@/components/ui/empty-state";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function DestinationsGrid({
  destinations,
  query = "",
}: {
  destinations: DestinationRecord[];
  /** Search text owned by the discovery hero; filters the rendered cards. */
  query?: string;
}) {
  const filtered = React.useMemo(() => {
    const q = normalize(query);
    if (!q) return destinations;
    return destinations.filter((d) => {
      const haystack = `${d.name} ${d.region ?? ""} ${d.description ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [destinations, query]);

  if (destinations.length === 0) {
    return (
      <EmptyState
        icon={Compass}
        title="Пока нет доступных направлений"
        description="Загляните позже — мы добавляем новые города и регионы."
      />
    );
  }

  if (filtered.length === 0) {
    return (
      <p className="text-on-surface-muted">
        Ничего не найдено. Попробуйте другой запрос.
      </p>
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
          category={d.category}
          rating={d.avgRating}
          featured={index === 0}
        />
      ))}
    </DiscoveryGrid>
  );
}
