export type TravelerBookingStatus =
  | "deposit_ready"
  | "deposit_paid"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export type TravelerBookingPaymentLineItem = {
  id: string;
  label: string;
  amountRub: number;
  kind: "service" | "fee" | "discount" | "tax";
};

export type TravelerBookingCancellationPolicy = {
  summary: string;
  bullets: string[];
};

export type TravelerBookingItineraryFrame = {
  timezone: string;
  days: Array<{
    day: number;
    title: string;
    beats: string[];
  }>;
  notes?: string;
};

export type TravelerBookingRecord = {
  id: string;
  status: TravelerBookingStatus;
  createdAt: string;
  updatedAt: string;
  listingSlug?: string;
  request: {
    id: string;
    destination: string;
    startDate: string;
    endDate: string;
    groupSize: number;
  };
  traveler: {
    displayName: string;
  };
  guide: {
    slug?: string;
    displayName: string;
    homeBase: string;
    rating: number;
    completedTrips: number;
    responseTimeHours: number;
  };
  itinerary: TravelerBookingItineraryFrame;
  payment: {
    currency: "RUB";
    lineItems: TravelerBookingPaymentLineItem[];
    depositRub: number;
    depositDueAt: string;
  };
  cancellationPolicy: TravelerBookingCancellationPolicy;
};

export type TravelerBookingTimelineStep = {
  id: string;
  bookingId: string;
  at: string | null;
  title: string;
  description?: string;
  state: "done" | "current" | "upcoming";
};

