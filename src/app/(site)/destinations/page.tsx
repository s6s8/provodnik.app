import type { Metadata } from "next";

import { DiscoveryHero, DiscoveryShell } from "@/components/shared/discovery-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DestinationsGrid } from "@/features/destinations/components/destinations-grid";
import { getDestinations, type DestinationRecord } from "@/data/supabase/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export function generateMetadata(): Metadata {
  return {
    title: "Направления",
    description: "Откройте лучшие направления для путешествий по России",
  };
}

export default async function DestinationsPage() {
  let destinations: DestinationRecord[] = [];
  let loadError = false;

  try {
    const supabase = await createSupabaseServerClient();
    const result = await getDestinations(supabase);
    if (result.error) loadError = true;
    else destinations = result.data ?? [];
  } catch {
    loadError = true;
  }

  return (
    <>
      <DiscoveryHero
        imageUrl="/hero-valley.jpg"
        imagePosition="center 50%"
        title="Направления"
        intro="Откройте города и регионы России — и найдите местного гида в каждом из них."
      />
      <DiscoveryShell>
        {loadError ? (
          <Alert variant="destructive">
            <AlertDescription>
              Не удалось загрузить направления. Попробуйте обновить страницу.
            </AlertDescription>
          </Alert>
        ) : (
          <DestinationsGrid destinations={destinations} />
        )}
      </DiscoveryShell>
    </>
  );
}
