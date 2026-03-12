import type {
  DisputeCaseRecord,
  DisputeMessage,
} from "@/data/disputes/types";

function isoDaysAgo(daysAgo: number) {
  const value = new Date();
  value.setDate(value.getDate() - daysAgo);
  return value.toISOString();
}

const seededDisputeCases: readonly DisputeCaseRecord[] = [
  {
    id: "dc_seed_kazan_quality_1",
    kind: "quality_issue",
    status: "needs_info",
    createdAt: isoDaysAgo(4),
    updatedAt: isoDaysAgo(1),
    bookingId: "bk_seed_kazan_deposit_ready_1",
    subject: "Itinerary expectations mismatch",
    requestedOutcome:
      "Adjust the plan to be slower-paced, or refund fees if the schedule cannot be adapted.",
  },
  {
    id: "dc_seed_rostov_refund_1",
    kind: "refund_request",
    status: "resolved",
    createdAt: isoDaysAgo(22),
    updatedAt: isoDaysAgo(18),
    bookingId: "bk_seed_kazan_deposit_ready_1",
    subject: "Refund request (demo case)",
    requestedOutcome: "Refund deposit due to schedule change (placeholder).",
    resolutionSummary:
      "Resolved as a demo: no real payments are processed in MVP baseline.",
  },
] as const;

const seededDisputeMessages: readonly DisputeMessage[] = [
  {
    id: "dcm_kazan_1",
    caseId: "dc_seed_kazan_quality_1",
    at: isoDaysAgo(4),
    from: "traveler",
    body: "The proposed pace feels too tight for us. Can we reduce the number of stops and add longer breaks?",
  },
  {
    id: "dcm_kazan_2",
    caseId: "dc_seed_kazan_quality_1",
    at: isoDaysAgo(3),
    from: "guide",
    body: "Yes — I can consolidate sights by neighborhood and add two warm breaks. Share any must-sees and we’ll cut the rest.",
  },
  {
    id: "dcm_kazan_3",
    caseId: "dc_seed_kazan_quality_1",
    at: isoDaysAgo(1),
    from: "platform",
    body: "Please confirm your maximum walking time per day and preferred start time. We’ll record the updated plan as the new baseline.",
  },
  {
    id: "dcm_refund_1",
    caseId: "dc_seed_rostov_refund_1",
    at: isoDaysAgo(22),
    from: "traveler",
    body: "Schedule changed on our side. Requesting a refund for the deposit (demo).",
  },
  {
    id: "dcm_refund_2",
    caseId: "dc_seed_rostov_refund_1",
    at: isoDaysAgo(18),
    from: "platform",
    body: "Resolved as a demo: no real payment is captured in this baseline. Consider this case closed.",
  },
] as const;

export function listSeededDisputeCasesForBooking(
  bookingId: string,
): DisputeCaseRecord[] {
  return seededDisputeCases
    .filter((item) => item.bookingId === bookingId)
    .map((item) => ({ ...item }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getSeededDisputeCaseById(caseId: string) {
  return seededDisputeCases.find((item) => item.id === caseId) ?? null;
}

export function listSeededMessagesForDisputeCase(
  caseId: string,
): DisputeMessage[] {
  return seededDisputeMessages
    .filter((item) => item.caseId === caseId)
    .map((item) => ({
      ...item,
      attachments: item.attachments ? [...item.attachments] : undefined,
    }))
    .sort((a, b) => a.at.localeCompare(b.at));
}

