"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  PublicListing,
  PublicListingTheme,
} from "@/data/public-listings/types";

type Filters = {
  region: string | "all";
  durationDays: PublicListing["durationDays"] | "all";
  theme: PublicListingTheme | "all";
};

const defaultFilters: Filters = {
  region: "all",
  durationDays: "all",
  theme: "all",
};

export function PublicListingFilters({
  listings,
  onFilteredListingsChange,
}: {
  listings: readonly PublicListing[];
  onFilteredListingsChange: (filtered: readonly PublicListing[]) => void;
}) {
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  const regions = useMemo(
    () => Array.from(new Set(listings.map((listing) => listing.region))).sort(),
    [listings],
  );

  const themes = useMemo(
    () => Array.from(new Set(listings.flatMap((listing) => listing.themes))).sort(),
    [listings],
  );

  const filtered = useMemo(() => {
    return listings.filter((listing) => {
      if (filters.region !== "all" && listing.region !== filters.region) return false;
      if (
        filters.durationDays !== "all" &&
        listing.durationDays !== filters.durationDays
      ) {
        return false;
      }
      if (filters.theme !== "all" && !listing.themes.includes(filters.theme)) {
        return false;
      }
      return true;
    });
  }, [filters, listings]);

  useEffect(() => {
    onFilteredListingsChange(filtered);
  }, [filtered, onFilteredListingsChange]);

  return (
    <Card className="bg-glass backdrop-blur-[20px] border border-white/70 shadow-glass rounded-[2rem]">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">Фильтры витрины</CardTitle>
          <Badge variant="secondary" className="rounded-full px-3">
            {filtered.length} вариантов
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <FilterBlock
          title="Регион"
          items={["all", ...regions]}
          active={filters.region}
          getLabel={(value) => (value === "all" ? "Все" : value)}
          onSelect={(value) =>
            setFilters((prev) => ({ ...prev, region: value as Filters["region"] }))
          }
        />

        <FilterBlock
          title="Длительность"
          items={["all", 1, 2, 3]}
          active={filters.durationDays}
          getLabel={(value) =>
            value === "all"
              ? "Все"
              : `${value} ${value === 1 ? "день" : value > 1 && value < 5 ? "дня" : "дней"}`
          }
          onSelect={(value) =>
            setFilters((prev) => ({
              ...prev,
              durationDays: value as Filters["durationDays"],
            }))
          }
        />

        <FilterBlock
          title="Формат"
          items={["all", ...themes]}
          active={filters.theme}
          getLabel={(value) => (value === "all" ? "Все" : value)}
          onSelect={(value) =>
            setFilters((prev) => ({ ...prev, theme: value as Filters["theme"] }))
          }
        />

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
          <p className="text-sm text-muted-foreground">
            Каталог показывает готовые форматы для MVP: короткие прогулки, поездки на
            день и сезонные маршруты.
          </p>
          <Button
            type="button"
            variant="ghost"
            className="rounded-full"
            onClick={() => setFilters(defaultFilters)}
          >
            Сбросить
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FilterBlock<T extends string | number>({
  title,
  items,
  active,
  getLabel,
  onSelect,
}: {
  title: string;
  items: readonly T[];
  active: T;
  getLabel: (item: T) => string;
  onSelect: (item: T) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Button
            key={String(item)}
            type="button"
            size="sm"
            variant={active === item ? "default" : "outline"}
            className="rounded-full"
            onClick={() => onSelect(item)}
          >
            {getLabel(item)}
          </Button>
        ))}
      </div>
    </div>
  );
}
