export type DisputeSeverity = "low" | "medium" | "high" | "critical";

export type BookingStatus =
  | "requested"
  | "confirmed"
  | "in-progress"
  | "completed"
  | "cancelled";

export type PayoutFreezePosture = "not-frozen" | "soft-freeze" | "hard-freeze";

export type DisputeStage =
  | "intake"
  | "investigating"
  | "awaiting-evidence"
  | "ready-to-decide"
  | "resolved";

export type DisputePolicyKey =
  | "cancellation"
  | "service-not-delivered"
  | "quality-mismatch"
  | "safety"
  | "fraud"
  | "chargeback";

export type DisputePolicyNoteKey = "context" | "required" | "prohibited" | "edge-case";

export type DisputeTimelineActor = "traveler" | "guide" | "system" | "admin";

export type DisputeTimelineEventType =
  | "opened"
  | "message"
  | "evidence"
  | "booking-update"
  | "payout-freeze"
  | "internal-note"
  | "decision";

export type DisputeQueueDisposition = "open" | "needs-action" | "waiting" | "resolved";

export type DisputeDecisionOutcome =
  | "refund-recommended"
  | "refund-denied"
  | "partial-refund-recommended"
  | "goodwill-credit-recommended"
  | "no-action";

export type DisputePolicyNote = {
  key: DisputePolicyNoteKey;
  title: string;
  detail: string;
};

export type DisputeTimelineEvent = {
  at: string;
  actor: DisputeTimelineActor;
  type: DisputeTimelineEventType;
  summary: string;
  detail?: string;
};

export type DisputeNextAction = {
  key: string;
  title: string;
  owner: DisputeTimelineActor | "ops";
  dueAt?: string;
};

export type DisputeCase = {
  id: string;
  createdAt: string;
  updatedAt: string;
  severity: DisputeSeverity;
  stage: DisputeStage;
  disposition: DisputeQueueDisposition;
  policyKey: DisputePolicyKey;
  booking: {
    id: string;
    status: BookingStatus;
    serviceDate: string;
    routeLabel: string;
    amount: { amount: number; currency: "USD" | "EUR" | "GEL" };
  };
  parties: {
    travelerDisplayName: string;
    guideDisplayName: string;
  };
  payout: {
    posture: PayoutFreezePosture;
    reason: string;
    frozenAt?: string;
  };
  summary: string;
  policyContext: readonly DisputePolicyNote[];
  timeline: readonly DisputeTimelineEvent[];
  nextActions: readonly DisputeNextAction[];
  recommendedOutcome?: DisputeDecisionOutcome;
};

