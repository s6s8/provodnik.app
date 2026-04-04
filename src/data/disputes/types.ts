export type DisputeCaseKind =
  | "refund_request"
  | "cancellation_dispute"
  | "quality_issue"
  | "no_show";

export type DisputeCaseStatus = "open" | "needs_info" | "resolved" | "closed";

export type DisputeParty = "traveler" | "guide" | "platform";

export type DisputeMessage = {
  id: string;
  caseId: string;
  at: string;
  from: DisputeParty;
  body: string;
  attachments?: readonly {
    label: string;
    url: string;
  }[];
};

export type DisputeCaseRecord = {
  id: string;
  kind: DisputeCaseKind;
  status: DisputeCaseStatus;
  createdAt: string;
  updatedAt: string;
  bookingId: string;
  subject: string;
  requestedOutcome: string;
  resolutionSummary?: string;
};

