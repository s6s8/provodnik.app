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

export type PublicListingTransportMode =
  | "walking"
  | "car"
  | "train"
  | "bus"
  | "boat";

export type PublicListingTransportOption = {
  mode: PublicListingTransportMode;
  label: string;
  detail?: string;
};

export type PublicListingTravelSegment = {
  id: string;
  fromLabel: string;
  toLabel: string;
  durationMinutes: number;
  transport: PublicListingTransportOption;
};

export type PublicListingPriceScenario = {
  id: string;
  label: string;
  partySize: number;
  totalRub: number;
  perPersonRub: number;
  note?: string;
};

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
  regionLabel?: string;
  destinationSlug?: string;
  coverImageUrl?: string;
  durationDays: 1 | 2 | 3;
  priceFromRub: number;
  groupSizeMax: number;
  themes: readonly PublicListingTheme[];
  highlights: readonly string[];
  itinerary: readonly PublicListingItineraryItem[];
  travelSegments?: readonly PublicListingTravelSegment[];
  transportOptions?: readonly PublicListingTransportOption[];
  priceScenarios?: readonly PublicListingPriceScenario[];
  inclusions: readonly PublicListingInclusion[];
  guideSlug: PublicGuideProfile["slug"];
};
