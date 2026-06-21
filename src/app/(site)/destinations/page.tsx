import type { Metadata } from "next";

import { ListHero } from "@/components/shared/list-hero";
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
    <section className="pb-20">
      <ListHero
        imageUrl="/hero-valley.jpg"
        imagePosition="center 50%"
        title="Направления"
        intro="Откройте города и регионы России — и найдите местного гида в каждом из них."
      />
      <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)] pt-10">
        {destinations.length === 0 ? (
          <p className="mt-2 text-on-surface-muted">Пока нет доступных направлений.</p>
        ) : (
          <DestinationsGrid destinations={destinations} />
        )}
      </div>
    </section>
  );
}
