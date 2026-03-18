import type { DestinationRecord } from "@/data/destinations/types";

export const stubDestinations: DestinationRecord[] = [
  {
    id: "dst_spb",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    destination: {
      slug: "saint-petersburg",
      kind: "city",
      label: "Saint Petersburg",
      countryCode: "RU",
      region: "Northwestern Federal District",
    },
  },
] as const;

