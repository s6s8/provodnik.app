import type { PublicGuideProfile } from "@/data/public-guides/types";
import type { ThemeSlug } from "@/data/themes";

export type PublicListingTheme = ThemeSlug;

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
  travelToNextMinutes?: number;
  travelToNextLabel?: string;
  transportOptions?: Array<
    "walking" | "city_bus" | "taxi" | "own_car" | "guide_transport"
  >;
};

export type PublicListing = {
  slug: string;
  title: string;
  city: string;
  region: string;
  coverImageUrl?: string;
  durationDays: number;
  priceFromRub: number;
  groupSizeMax: number;
  themes: readonly PublicListingTheme[];
  highlights: readonly string[];
  itinerary: readonly PublicListingItineraryItem[];
  inclusions: readonly PublicListingInclusion[];
  guideSlug: PublicGuideProfile["slug"];
};

