/**
 * Tripster v1 — Review + Reply state machines
 * Review:      draft → submitted → published | hidden
 * ReviewReply: draft → pending_review → published | draft (rejected back)
 */

export type ReviewStatus = "draft" | "submitted" | "published" | "hidden";
export type ReviewReplyStatus = "draft" | "pending_review" | "published";

const REVIEW_TRANSITIONS: Record<ReviewStatus, ReviewStatus[]> = {
  draft:     ["submitted"],
  submitted: ["published", "hidden"],
  published: ["hidden"],
  hidden:    [],
};

const REPLY_TRANSITIONS: Record<ReviewReplyStatus, ReviewReplyStatus[]> = {
  draft:          ["pending_review"],
  pending_review: ["published", "draft"],
  published:      [],
};

export function canTransitionReview(from: ReviewStatus, to: ReviewStatus): boolean {
  return REVIEW_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canTransitionReply(
  from: ReviewReplyStatus,
  to: ReviewReplyStatus
): boolean {
  return REPLY_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertReviewTransition(from: ReviewStatus, to: ReviewStatus): void {
  if (!canTransitionReview(from, to)) {
    throw new Error(
      `Illegal review transition: ${from} → ${to}. Allowed: ${REVIEW_TRANSITIONS[from].join(", ") || "none"}`
    );
  }
}

export function assertReplyTransition(
  from: ReviewReplyStatus,
  to: ReviewReplyStatus
): void {
  if (!canTransitionReply(from, to)) {
    throw new Error(
      `Illegal reply transition: ${from} → ${to}. Allowed: ${REPLY_TRANSITIONS[from].join(", ") || "none"}`
    );
  }
}
