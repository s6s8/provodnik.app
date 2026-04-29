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
        <p className="mb-2 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Направления
        </p>
        <h1 className="mt-2 mb-3 font-display text-[clamp(2.25rem,5vw,3.625rem)] font-semibold leading-[1.05] text-on-surface">
          Куда поедем?
        </h1>
        <p className="max-w-[46rem] text-base leading-[1.65] text-on-surface-muted">
          Города и регионы России с проверенными маршрутами и локальными гидами.
        </p>

        {destinations.length === 0 ? (
          <p className="mt-8 text-on-surface-muted">Пока нет доступных направлений.</p>
        ) : (
          <DestinationsGrid destinations={destinations} />
        )}
      </div>
    </section>
  );
}
