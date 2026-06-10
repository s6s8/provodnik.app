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
  endsOn?: string | null;
  startTime?: string | null;
  participantsCount?: number | null;
  budget?: { amount: number; currency: string } | null;
  offerCount?: number;
  unreadOfferCount?: number;
  isOwnRequest: boolean;
  /** «Открыт к увеличению группы» — render «+ к группе» pill */
  openToJoin?: boolean;
  /** traveler selected flexible dates — render «± даты» pill */
  datesFlexible?: boolean;
  /** group format: 'assembly' = сборная группа, 'private' = своя группа */
  groupType?: "assembly" | "private";
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
  createdAt?: string;
  reviewRating?: number;
};
