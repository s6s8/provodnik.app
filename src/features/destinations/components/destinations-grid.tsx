"use client";

import * as React from "react";
import { Compass, Search } from "lucide-react";

import type { DestinationRecord } from "@/data/supabase/queries";
import { DestinationCard } from "@/components/discovery/DestinationCard";
import { DiscoveryGrid } from "@/components/shared/discovery-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function DestinationsGrid({
  destinations,
}: {
  destinations: DestinationRecord[];
}) {
  const [query, setQuery] = React.useState("");

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

  return (
    <>
      <div className="max-w-xl">
        <label htmlFor="dest-search" className="sr-only">
          Поиск направления
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="dest-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по городу, региону или описанию"
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-on-surface-muted">
          Ничего не найдено. Попробуйте другой запрос.
        </p>
      ) : (
        <DiscoveryGrid className="mt-8">
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
      )}
    </>
  );
}
