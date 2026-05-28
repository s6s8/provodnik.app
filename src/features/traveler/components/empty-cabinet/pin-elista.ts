import type { DestinationRecord } from "@/data/supabase/queries";

import type { Inspiration } from "./empty-cabinet";

export function pinElistaInspirations(destinations: DestinationRecord[]): Inspiration[] {
  const elista = destinations.find((destination) => destination.slug === "elista");
  const others = destinations
    .filter((destination) => destination.slug !== "elista")
    .slice(0, elista ? 2 : 3);
  const pinned = elista ? [...others, elista] : others;

  return pinned.map((destination) => ({
    slug: destination.slug,
    label: destination.name,
    imageUrl: destination.heroImageUrl,
  }));
}
