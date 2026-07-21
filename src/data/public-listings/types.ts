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
  /** Optional non-listing detail route for records adapted from guide_templates. */
  detailHref?: string;
  title: string;
  city: string;
  region: string;
  coverImageUrl?: string;
  durationDays: number;
  priceFromRub: number;
  groupSizeMax: number;
  /** Real booking format enum (private | group | combo); drives the price unit. */
  format?: "private" | "group" | "combo" | null;
  /** Ready-tour price scope; overrides the format badge for price wording. */
  priceScope?: "per_person" | "per_group";
  themes: readonly PublicListingTheme[];
  highlights: readonly string[];
  itinerary: readonly PublicListingItineraryItem[];
  inclusions: readonly PublicListingInclusion[];
  guideSlug: PublicGuideProfile["slug"];
  guideName?: string;
  guideAvatarUrl?: string;
  rating?: number;
  reviewCount?: number;
};

