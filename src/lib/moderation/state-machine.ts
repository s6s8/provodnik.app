/**
 * Tripster v1 — Listing moderation state machine
 * draft → pending_review → active | rejected
 * rejected → (guide edits) → pending_review (re-submission)
 */

export type ListingModerationStatus =
  | "draft"
  | "pending_review"
  | "active"
  | "rejected"
  | "archived";

const LEGAL_TRANSITIONS: Record<ListingModerationStatus, ListingModerationStatus[]> = {
  draft:          ["pending_review"],
  pending_review: ["active", "rejected"],
  active:         ["pending_review", "archived"],
  rejected:       ["pending_review", "archived"],
  archived:       [],
};

export function canTransitionListing(
  from: ListingModerationStatus,
  to: ListingModerationStatus
): boolean {
  return LEGAL_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertListingTransition(
  from: ListingModerationStatus,
  to: ListingModerationStatus
): void {
  if (!canTransitionListing(from, to)) {
    throw new Error(
      `Illegal listing transition: ${from} → ${to}. Allowed: ${LEGAL_TRANSITIONS[from].join(", ") || "none"}`
    );
  }
}

export function isModerationStatus(s: string): s is ListingModerationStatus {
  return ["draft", "pending_review", "active", "rejected", "archived"].includes(s);
}
