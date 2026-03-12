"use client";

import { useMemo, useState } from "react";

import { PublicListingCard } from "@/features/listings/components/public/public-listing-card";
import { PublicListingFilters } from "@/features/listings/components/public/public-listing-filters";
import type { PublicListing } from "@/data/public-listings/types";

export function PublicListingDiscoveryScreen({
  listings,
}: {
  listings: readonly PublicListing[];
}) {
  const [filtered, setFiltered] = useState<readonly PublicListing[]>(listings);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => a.priceFromRub - b.priceFromRub);
  }, [filtered]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Public discovery</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Explore seeded tours
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground">
          A lightweight discovery surface for the MVP baseline: cards, quick
          filters, and a detail view with trust framing.
        </p>
      </div>

      <PublicListingFilters
        listings={listings}
        onFilteredListingsChange={setFiltered}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {sorted.map((listing) => (
          <PublicListingCard key={listing.slug} listing={listing} />
        ))}
      </div>
    </div>
  );
}

