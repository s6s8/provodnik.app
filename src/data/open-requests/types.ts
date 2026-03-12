export type OpenRequestVisibility = "public" | "invite_only";

export type OpenRequestStatus = "open" | "forming_group" | "matched" | "closed";

export type OpenRequestGroupRosterRole = "organizer" | "member";

export type OpenRequestGroupRosterMember = {
  id: string;
  requestId: string;
  userId: string;
  displayName: string;
  role: OpenRequestGroupRosterRole;
  joinedAt: string;
  note?: string;
};

export type OpenRequestRecord = {
  id: string;
  status: OpenRequestStatus;
  visibility: OpenRequestVisibility;
  createdAt: string;
  updatedAt: string;
  travelerRequestId: string;
  group: {
    sizeTarget: number;
    sizeCurrent: number;
    openToMoreMembers: boolean;
  };
  destinationLabel: string;
  dateRangeLabel: string;
  budgetPerPersonRub?: number;
  highlights: string[];
};

