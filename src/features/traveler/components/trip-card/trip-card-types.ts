export type TripPhase =
  | "today"
  | "upcoming"
  | "awaiting_decision"
  | "waiting_offers"
  | "completed";

export type TripCardModel = {
  id: string;
  destination: string;
  startsOn: string; // ISO date
  isOwnRequest: boolean;
  guideName: string | null;
  guideAvatarUrl: string | null;
  organizerName: string | null;
  /** present only for confirmed bookings (upcoming/today/completed) */
  routeStops?: { photoUrl: string; address?: string }[];
  /** present only for awaiting_decision */
  topOffersPhotos?: (string | null)[]; // up to 3
  /** present only for waiting_offers */
  destinationCityPhotoUrl?: string | null;
  inclusions?: string[];
  price?: { amount: number; currency: string };
  hasReview?: boolean;
  reviewRating?: number;
};
