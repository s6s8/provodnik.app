import type { GuideListing } from "@/data/guide-listing/schema";
import type {
  GuideListingManagerItem,
  GuideListingRecord,
} from "@/data/guide-listing/types";

function isoDaysAgo(daysAgo: number) {
  const value = new Date();
  value.setDate(value.getDate() - daysAgo);
  return value.toISOString();
}

const seededGuideListings: GuideListingRecord[] = [
  {
    id: "gl_seed_kazan_food_walk_1",
    createdAt: isoDaysAgo(25),
    updatedAt: isoDaysAgo(2),
    listing: {
      title: "Kazan street food walk (market + hidden tea rooms)",
      region: "Kazan",
      durationHours: 3.5,
      capacity: 6,
      inclusions: ["Guiding service", "Tasting map + vendor notes"],
      exclusions: ["Food & drinks", "Transport"],
      pricing: { mode: "per_person", priceRub: 6_500 },
      status: "active",
    },
  },
  {
    id: "gl_seed_spb_museums_1",
    createdAt: isoDaysAgo(12),
    updatedAt: isoDaysAgo(6),
    listing: {
      title: "Saint Petersburg museums: calm pace, curator picks",
      region: "Saint Petersburg",
      durationHours: 5,
      capacity: 4,
      inclusions: ["Guiding service", "Route planning", "Museum timing guidance"],
      exclusions: ["Tickets", "Transfers"],
      pricing: { mode: "per_group", priceRub: 29_000 },
      status: "paused",
    },
  },
  {
    id: "gl_seed_altai_day_hike_1",
    createdAt: isoDaysAgo(4),
    updatedAt: isoDaysAgo(1),
    listing: {
      title: "Altai day hike: viewpoints + picnic stop",
      region: "Altai",
      durationHours: 8,
      capacity: 5,
      inclusions: ["Guiding service", "Safety briefing", "Weather plan"],
      exclusions: ["Meals", "Transfers", "Accommodation"],
      pricing: { mode: "per_person", priceRub: 14_000 },
      status: "draft",
    },
  },
];

export function getSeededGuideListingRecords(): GuideListingRecord[] {
  return seededGuideListings.map((record) => ({
    ...record,
    listing: {
      ...record.listing,
      inclusions: [...record.listing.inclusions],
      exclusions: [...record.listing.exclusions],
      pricing: { ...record.listing.pricing },
    },
  }));
}

export function getSeededGuideListings(): GuideListingManagerItem[] {
  return getSeededGuideListingRecords()
    .map((record) => ({
      id: record.id,
      title: record.listing.title,
      region: record.listing.region,
      durationHours: record.listing.durationHours,
      capacity: record.listing.capacity,
      priceRub: record.listing.pricing.priceRub,
      pricingMode: record.listing.pricing.mode,
      status: record.listing.status,
      updatedAt: record.updatedAt,
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getSeededGuideListingById(
  listingId: string
): (GuideListingRecord & { listing: GuideListing }) | null {
  return getSeededGuideListingRecords().find((record) => record.id === listingId) ?? null;
}

