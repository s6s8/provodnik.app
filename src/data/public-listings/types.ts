import type { PublicGuideProfile } from "@/data/public-guides/types";

export type PublicListingTheme =
  | "Food"
  | "History"
  | "Nature"
  | "Photography"
  | "Family"
  | "Off-season";

export type PublicListingInclusion =
  | "Guide time"
  | "Local transport"
  | "Museum tickets"
  | "Tea & snacks"
  | "Safety equipment";

export type PublicListingItineraryItem = {
  title: string;
  description: string;
  durationHours: number;
};

export type PublicListing = {
  slug: string;
  title: string;
  city: string;
  region: string;
  durationDays: 1 | 2 | 3;
  priceFromRub: number;
  groupSizeMax: number;
  themes: readonly PublicListingTheme[];
  highlights: readonly string[];
  itinerary: readonly PublicListingItineraryItem[];
  inclusions: readonly PublicListingInclusion[];
  guideSlug: PublicGuideProfile["slug"];
};

