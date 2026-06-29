"use client";

import * as React from "react";

import { DiscoveryHero, DiscoveryShell } from "@/components/shared/discovery-shell";
import { DiscoverySearchInput } from "@/components/shared/discovery-search-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DestinationsGrid } from "@/features/destinations/components/destinations-grid";
import type { DestinationRecord } from "@/data/supabase/queries";

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

      <DiscoveryShell>
        {loadError ? (
          <Alert variant="destructive">
            <AlertDescription>
              Не удалось загрузить направления. Попробуйте обновить страницу.
            </AlertDescription>
          </Alert>
        ) : (
          <DestinationsGrid destinations={destinations} query={query} />
        )}
      </DiscoveryShell>
    </>
  );
}
