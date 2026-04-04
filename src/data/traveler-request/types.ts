import type { TravelerRequest } from "@/data/traveler-request/schema";

export type TravelerRequestStatus =
  | "draft"
  | "submitted"
  | "offers_received"
  | "shortlisted"
  | "booked"
  | "closed";

export type TravelerRequestRecord = {
  id: string;
  status: TravelerRequestStatus;
  createdAt: string;
  updatedAt: string;
  request: TravelerRequest;
};

export type TravelerOfferStatus = "new" | "shortlisted" | "declined" | "accepted";

export type TravelerOffer = {
  id: string;
  requestId: string;
  status: TravelerOfferStatus;
  createdAt: string;
  guide: {
    name: string;
    rating: number;
    completedTrips: number;
    homeBase: string;
    responseTimeHours: number;
  };
  priceTotalRub: number;
  durationDays: number;
  groupSizeMin: number;
  groupSizeMax: number;
  highlights: string[];
  included: string[];
  message: string;
};

export type TravelerRequestTimelineEvent = {
  id: string;
  requestId: string;
  at: string;
  title: string;
  description?: string;
};

