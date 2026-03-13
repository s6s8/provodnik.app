import type { PublicGuideProfile } from "@/data/public-guides/types";

export type PublicListingTheme =
  | "Еда"
  | "История"
  | "Природа"
  | "Фотография"
  | "С семьей"
  | "Несезон";

export type PublicListingInclusion =
  | "Работа гида"
  | "Локальный транспорт"
  | "Билеты в музеи"
  | "Чай и перекус"
  | "Снаряжение";

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

