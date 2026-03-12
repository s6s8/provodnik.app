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
  region: string | "All";
  durationDays: PublicListing["durationDays"] | "All";
  theme: PublicListingTheme | "All";
};

const defaultFilters: Filters = {
  region: "All",
  durationDays: "All",
  theme: "All",
};

export function PublicListingFilters({
  listings,
  onFilteredListingsChange,
}: {
  listings: readonly PublicListing[];
  onFilteredListingsChange: (filtered: readonly PublicListing[]) => void;
}) {
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  const regions = useMemo(() => {
    return Array.from(new Set(listings.map((l) => l.region))).sort();
  }, [listings]);

  const themes = useMemo(() => {
    return Array.from(new Set(listings.flatMap((l) => l.themes))).sort();
  }, [listings]);

  const filtered = useMemo(() => {
    return listings.filter((listing) => {
      if (filters.region !== "All" && listing.region !== filters.region) {
        return false;
      }
      if (
        filters.durationDays !== "All" &&
        listing.durationDays !== filters.durationDays
      ) {
        return false;
      }
      if (filters.theme !== "All" && !listing.themes.includes(filters.theme)) {
        return false;
      }
      return true;
    });
  }, [filters, listings]);

  useEffect(() => {
    onFilteredListingsChange(filtered);
  }, [filtered, onFilteredListingsChange]);

  return (
    <Card className="border-border/70 bg-card/80">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">Filters</CardTitle>
          <Badge variant="secondary">{filtered.length} matches</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.18em]">
              Region
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={filters.region === "All" ? "default" : "outline"}
                onClick={() => setFilters((prev) => ({ ...prev, region: "All" }))}
              >
                All
              </Button>
              {regions.map((region) => (
                <Button
                  key={region}
                  type="button"
                  size="sm"
                  variant={filters.region === region ? "default" : "outline"}
                  onClick={() => setFilters((prev) => ({ ...prev, region }))}
                >
                  {region}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.18em]">
              Duration
            </p>
            <div className="flex flex-wrap gap-2">
              {(["All", 1, 2, 3] as const).map((value) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={filters.durationDays === value ? "default" : "outline"}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, durationDays: value }))
                  }
                >
                  {value === "All" ? "All" : `${value} day${value === 1 ? "" : "s"}`}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.18em]">
              Theme
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={filters.theme === "All" ? "default" : "outline"}
                onClick={() => setFilters((prev) => ({ ...prev, theme: "All" }))}
              >
                All
              </Button>
              {themes.map((theme) => (
                <Button
                  key={theme}
                  type="button"
                  size="sm"
                  variant={filters.theme === theme ? "default" : "outline"}
                  onClick={() => setFilters((prev) => ({ ...prev, theme }))}
                >
                  {theme}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            These are seeded examples for the public baseline.
          </p>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setFilters(defaultFilters)}
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

