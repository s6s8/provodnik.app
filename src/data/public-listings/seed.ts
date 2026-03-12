import type { PublicListing } from "@/data/public-listings/types";

export const seededPublicListings: readonly PublicListing[] = [
  {
    slug: "rostov-food-walk",
    title: "Rostov food walk: markets + riverside bites",
    city: "Rostov-on-Don",
    region: "Rostov Oblast",
    durationDays: 1,
    priceFromRub: 8500,
    groupSizeMax: 6,
    themes: ["Food", "History", "Family"],
    highlights: [
      "Central market with a guide-led tasting route",
      "Riverside walk with context, not trivia",
      "Backup indoor stops for weather",
    ],
    itinerary: [
      {
        title: "Warm start + plan check",
        description:
          "Quick preferences check, pacing, and what to skip if the market is packed.",
        durationHours: 0.5,
      },
      {
        title: "Market lanes + tastings",
        description:
          "High-signal stalls and local staples with practical buying tips.",
        durationHours: 2,
      },
      {
        title: "Old streets + river promenade",
        description:
          "Compact loop with photo stops and a clean logistics finish near transport.",
        durationHours: 1.5,
      },
    ],
    inclusions: ["Guide time", "Tea & snacks"],
    guideSlug: "maria-rostov",
  },
  {
    slug: "baikal-ice-safety-day",
    title: "Baikal winter day: ice routes + safety pacing",
    city: "Irkutsk",
    region: "Irkutsk Oblast",
    durationDays: 1,
    priceFromRub: 14500,
    groupSizeMax: 5,
    themes: ["Nature", "Photography", "Off-season"],
    highlights: [
      "Realistic distances for the group (no hero plans)",
      "Ice safety checkpoints and warm breaks",
      "Photo-focused stops with time windows",
    ],
    itinerary: [
      {
        title: "Conditions briefing",
        description:
          "Route selection based on wind, visibility, and current surface.",
        durationHours: 0.75,
      },
      {
        title: "Ice walk + shoreline viewpoints",
        description:
          "Short segments, controlled pace, and clear regroup points.",
        durationHours: 3,
      },
      {
        title: "Warm checkpoint + wrap",
        description:
          "Hot tea stop and a predictable finish for return transport.",
        durationHours: 1,
      },
    ],
    inclusions: ["Guide time", "Tea & snacks", "Safety equipment"],
    guideSlug: "alexei-baikal",
  },
  {
    slug: "rostov-day-trip-azov",
    title: "Azov day trip: fortress, coast, and local lunch",
    city: "Azov",
    region: "Rostov Oblast",
    durationDays: 1,
    priceFromRub: 12500,
    groupSizeMax: 6,
    themes: ["History", "Family", "Photography"],
    highlights: [
      "Fortress + museum context without overloading",
      "Coastal viewpoints with optional short walks",
      "Flexible lunch options (allergies-friendly)",
    ],
    itinerary: [
      {
        title: "Transfer + timing buffer",
        description:
          "Departure timed to avoid queues; plan variants for weekends.",
        durationHours: 1,
      },
      {
        title: "Fortress loop",
        description:
          "Compact circuit with context, photos, and rest points.",
        durationHours: 2,
      },
      {
        title: "Lunch + coast",
        description:
          "Local lunch stop, then a short coastal segment for wind/season.",
        durationHours: 2,
      },
    ],
    inclusions: ["Guide time", "Local transport"],
    guideSlug: "maria-rostov",
  },
] as const;

export function getSeededPublicListing(slug: string) {
  return seededPublicListings.find((listing) => listing.slug === slug) ?? null;
}

