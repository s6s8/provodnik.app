import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DestinationsDiscoveryScreen } from "@/features/destinations/components/destinations-discovery-screen";
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

  // No destinations yet — avoid a dead empty catalog by direct URL; send home
  // until real content exists. Self-heals once destinations are seeded (PRD-021).
  if (!loadError && destinations.length === 0) {
    redirect("/");
  }

  return <DestinationsDiscoveryScreen destinations={destinations} loadError={loadError} />;
}
