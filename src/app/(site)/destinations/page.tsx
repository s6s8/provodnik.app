import type { Metadata } from "next";

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

  try {
    const supabase = await createSupabaseServerClient();
    const result = await getDestinations(supabase);
    if (result.data) destinations = result.data;
  } catch {
    // destinations stays []
  }

  return (
    <section className="bg-surface pt-24 pb-20">
      <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
        <h1 className="mb-8 font-display text-[clamp(2.25rem,5vw,3.625rem)] font-semibold leading-[1.05] text-on-surface">
          Направления
        </h1>

        {destinations.length === 0 ? (
          <p className="mt-8 text-on-surface-muted">Пока нет доступных направлений.</p>
        ) : (
          <DestinationsGrid destinations={destinations} />
        )}
      </div>
    </section>
  );
}
