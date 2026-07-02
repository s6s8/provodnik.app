import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DestinationsDiscoveryScreen } from "@/features/destinations/components/destinations-discovery-screen";
import { getDestinations, type DestinationRecord } from "@/data/supabase/queries";
import { flags } from "@/lib/flags";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export function generateMetadata(): Metadata {
  return {
    title: "Направления",
    description: "Откройте лучшие направления для путешествий по России",
  };
}

export default async function DestinationsPage() {
  // Public destinations catalog is hidden (Wildberries review) unless re-approved.
  if (!flags.FEATURE_PUBLIC_CATALOG) notFound();

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

  return <DestinationsDiscoveryScreen destinations={destinations} loadError={loadError} />;
}
