/**
 * Tripster v1 — Request/Offer state machine
 * Tripster bid-first flow: guide sends bid → traveler confirms → active → completed
 * Lives alongside legacy offer states (pending/accepted/declined/expired/withdrawn).
 */

export type TripsterOfferStatus =
  | "bid_sent"
  | "confirmed"
  | "active"
  | "completed"
  | "declined";

const LEGAL_TRANSITIONS: Record<TripsterOfferStatus, TripsterOfferStatus[]> = {
  bid_sent:  ["confirmed", "declined"],
  confirmed: ["active", "declined"],
  active:    ["completed"],
  completed: [],
  declined:  [],
};

export function canTransition(
  from: TripsterOfferStatus,
  to: TripsterOfferStatus
): boolean {
  return LEGAL_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(
  from: TripsterOfferStatus,
  to: TripsterOfferStatus
): void {
  if (!canTransition(from, to)) {
    throw new Error(
      `Illegal offer transition: ${from} → ${to}. Allowed: ${LEGAL_TRANSITIONS[from].join(", ") || "none"}`
    );
  }
}

export function isTripsterStatus(status: string): status is TripsterOfferStatus {
  return ["bid_sent", "confirmed", "active", "completed", "declined"].includes(status);
}
