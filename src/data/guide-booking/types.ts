export type GuideBookingStatus =
  | "awaiting_confirmation"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export type GuideBookingTravelerRosterItem = {
  id: string;
  displayName: string;
  isPrimaryContact?: boolean;
  notes?: string;
};

export type GuideBookingItinerarySummary = {
  timezone: string;
  days: Array<{
    day: number;
    title: string;
    beats: string[];
  }>;
  notes?: string;
};

export type GuideBookingPaymentLineItem = {
  id: string;
  label: string;
  amountRub: number;
  kind: "service" | "fee" | "discount" | "tax";
};

export type GuideBookingPaymentFrame = {
  currency: "RUB";
  lineItems: GuideBookingPaymentLineItem[];
  depositRub: number;
  depositDueAt: string;
  payoutEstimateRub: number;
};

export type GuideBookingRecord = {
  id: string;
  status: GuideBookingStatus;
  createdAt: string;
  updatedAt: string;
  request: {
    id: string;
    destination: string;
    startDate: string;
    endDate: string;
    groupSize: number;
  };
  travelerRoster: GuideBookingTravelerRosterItem[];
  itinerary: GuideBookingItinerarySummary;
  payment: GuideBookingPaymentFrame;
};

