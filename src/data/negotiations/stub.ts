import type { NegotiationRecord } from "@/data/negotiations/types";

export const stubNegotiations: NegotiationRecord[] = [
  {
    id: "neg_stub_1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    negotiation: {
      kind: "offer_thread",
      status: "draft",
      travelerRequestId: "req_stub_1",
      openRequestId: undefined,
      guideId: "guide_stub_1",
      offerId: undefined,
      subject: "Draft offer thread (stub)",
      messages: [
        {
          id: "neg_msg_1",
          sentAt: "2026-01-01T00:00:00.000Z",
          authorRole: "system",
          body: "Negotiations are a contract stub in Phase 0; no persistence yet.",
        },
      ],
    },
  },
] as const;

