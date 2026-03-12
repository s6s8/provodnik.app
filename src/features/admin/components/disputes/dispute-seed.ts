import type { DisputeCase } from "@/features/admin/types/disputes";

export const DEFAULT_DISPUTE_CASES: readonly DisputeCase[] = [
  {
    id: "dc_48102",
    createdAt: "2026-03-10T07:12:00Z",
    updatedAt: "2026-03-11T16:34:00Z",
    severity: "high",
    stage: "investigating",
    disposition: "needs-action",
    policyKey: "service-not-delivered",
    booking: {
      id: "bk_77319",
      status: "completed",
      serviceDate: "2026-03-09T10:00:00Z",
      routeLabel: "Airport transfer - Tbilisi → Old Town",
      amount: { amount: 19, currency: "USD" },
    },
    parties: {
      travelerDisplayName: "Mariam K.",
      guideDisplayName: "GeoRide",
    },
    payout: {
      posture: "soft-freeze",
      reason: "Dispute opened before payout settlement window.",
      frozenAt: "2026-03-10T07:15:00Z",
    },
    summary:
      "Traveler reports the driver never arrived; guide states the traveler no-showed. Need call logs / pickup GPS proof.",
    policyContext: [
      {
        key: "context",
        title: "Scope",
        detail:
          "This case is handled as service-not-delivered. Determine whether pickup attempt evidence exists and whether traveler was reachable.",
      },
      {
        key: "required",
        title: "Evidence to request",
        detail:
          "Pickup timestamp + location proof, traveler contact attempt logs, and any in-app messages within 2 hours of service time.",
      },
      {
        key: "edge-case",
        title: "No-show vs not delivered",
        detail:
          "If guide can show arrival + attempted contact and traveler confirms wrong pickup point, consider partial goodwill rather than refund.",
      },
    ],
    timeline: [
      {
        at: "2026-03-09T09:42:00Z",
        actor: "system",
        type: "booking-update",
        summary: "Booking marked in-progress.",
      },
      {
        at: "2026-03-09T10:40:00Z",
        actor: "system",
        type: "booking-update",
        summary: "Booking marked completed by provider.",
      },
      {
        at: "2026-03-10T07:12:00Z",
        actor: "traveler",
        type: "opened",
        summary: "Dispute opened: driver did not arrive.",
      },
      {
        at: "2026-03-10T07:15:00Z",
        actor: "system",
        type: "payout-freeze",
        summary: "Soft payout freeze applied.",
        detail: "Funds held pending operator review; no execution performed in this scaffold.",
      },
      {
        at: "2026-03-10T12:28:00Z",
        actor: "guide",
        type: "message",
        summary: "Provider response: traveler no-show; waited 15 minutes.",
      },
      {
        at: "2026-03-11T16:34:00Z",
        actor: "admin",
        type: "internal-note",
        summary: "Requested pickup evidence and contact logs.",
      },
    ],
    nextActions: [
      {
        key: "request-proof",
        title: "Request pickup proof (GPS + timestamp) and contact attempts",
        owner: "admin",
        dueAt: "2026-03-12T12:00:00Z",
      },
      {
        key: "traveler-confirm",
        title: "Confirm traveler pickup point and reachable phone number",
        owner: "ops",
      },
      {
        key: "decision-ready",
        title: "Move to ready-to-decide once evidence received",
        owner: "admin",
      },
    ],
    recommendedOutcome: "refund-recommended",
  },
  {
    id: "dc_48127",
    createdAt: "2026-03-10T18:04:00Z",
    updatedAt: "2026-03-11T09:18:00Z",
    severity: "critical",
    stage: "awaiting-evidence",
    disposition: "waiting",
    policyKey: "safety",
    booking: {
      id: "bk_77402",
      status: "cancelled",
      serviceDate: "2026-03-10T12:00:00Z",
      routeLabel: "City walking tour - Yerevan",
      amount: { amount: 42, currency: "USD" },
    },
    parties: {
      travelerDisplayName: "Nina V.",
      guideDisplayName: "Arman K.",
    },
    payout: {
      posture: "hard-freeze",
      reason: "Safety allegation triggers automatic hard freeze posture.",
      frozenAt: "2026-03-10T18:05:00Z",
    },
    summary:
      "Traveler alleges unsafe behavior and harassment. Booking was cancelled. Requires evidence capture, account review, and policy-driven escalation.",
    policyContext: [
      {
        key: "context",
        title: "Safety posture",
        detail:
          "Safety disputes default to hard freeze posture and require escalation. This UI is audit-oriented only; it does not execute actions.",
      },
      {
        key: "required",
        title: "Immediate actions",
        detail:
          "Collect traveler statement, preserve chat logs, and document any emergency contacts. Consider temporary access restrictions (out of scope here).",
      },
      {
        key: "prohibited",
        title: "Operator constraints",
        detail:
          "Do not contact the parties outside documented channels. Avoid speculative statements in internal notes.",
      },
    ],
    timeline: [
      {
        at: "2026-03-10T18:04:00Z",
        actor: "traveler",
        type: "opened",
        summary: "Dispute opened: safety concern (harassment allegation).",
      },
      {
        at: "2026-03-10T18:05:00Z",
        actor: "system",
        type: "payout-freeze",
        summary: "Hard payout freeze posture applied.",
      },
      {
        at: "2026-03-11T09:18:00Z",
        actor: "admin",
        type: "internal-note",
        summary: "Escalated to safety review; requested traveler statement.",
      },
    ],
    nextActions: [
      { key: "collect-statement", title: "Collect traveler written statement", owner: "admin" },
      { key: "preserve-logs", title: "Preserve message timeline snapshot", owner: "admin" },
      {
        key: "safety-escalation",
        title: "Escalate to safety lead (no execution in scaffold)",
        owner: "ops",
      },
    ],
  },
  {
    id: "dc_48163",
    createdAt: "2026-03-11T11:29:00Z",
    updatedAt: "2026-03-11T14:05:00Z",
    severity: "medium",
    stage: "intake",
    disposition: "open",
    policyKey: "quality-mismatch",
    booking: {
      id: "bk_77418",
      status: "completed",
      serviceDate: "2026-03-11T08:30:00Z",
      routeLabel: "Day trip - Almaty to Medeu",
      amount: { amount: 65, currency: "USD" },
    },
    parties: {
      travelerDisplayName: "Anton S.",
      guideDisplayName: "Nurlan D.",
    },
    payout: {
      posture: "not-frozen",
      reason: "No freeze posture by default for quality mismatch intake.",
    },
    summary:
      "Traveler claims itinerary differed from listing; guide claims conditions required route adjustment. Need scope check and evidence.",
    policyContext: [
      {
        key: "context",
        title: "Quality mismatch scope",
        detail:
          "Focus on whether the delivered service materially diverged from the listing and whether changes were communicated and accepted.",
      },
      {
        key: "required",
        title: "What to capture",
        detail:
          "Listing snapshot, itinerary expectations, traveler/guide messages about changes, and any receipts for alternatives.",
      },
    ],
    timeline: [
      {
        at: "2026-03-11T11:29:00Z",
        actor: "traveler",
        type: "opened",
        summary: "Dispute opened: itinerary mismatch.",
      },
      {
        at: "2026-03-11T14:05:00Z",
        actor: "guide",
        type: "message",
        summary: "Provider response: weather required alternate route; traveler agreed.",
      },
    ],
    nextActions: [
      { key: "snapshot", title: "Attach listing snapshot (policy context)", owner: "admin" },
      { key: "message-review", title: "Review message history for consent", owner: "admin" },
    ],
    recommendedOutcome: "partial-refund-recommended",
  },
] as const;

export function getDisputeCaseById(caseId: string) {
  return DEFAULT_DISPUTE_CASES.find((item) => item.id === caseId) ?? null;
}

