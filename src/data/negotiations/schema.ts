import { z } from "zod";

export const negotiationKinds = ["offer_thread", "booking_change"] as const;

export const negotiationStatuses = [
  "draft",
  "open",
  "countered",
  "accepted",
  "declined",
  "expired",
] as const;

export const negotiationMessageSchema = z.object({
  id: z.string().min(1),
  sentAt: z.string().min(1),
  authorRole: z.enum(["traveler", "guide", "system"]),
  body: z.string().trim().min(1).max(2_000),
});

export const negotiationSchema = z.object({
  kind: z.enum(negotiationKinds),
  status: z.enum(negotiationStatuses),
  travelerRequestId: z.string().min(1),
  openRequestId: z.string().optional(),
  guideId: z.string().optional(),
  offerId: z.string().optional(),
  subject: z.string().trim().min(2).max(140),
  messages: z.array(negotiationMessageSchema).default([]),
  expiresAt: z.string().optional(),
});

export type NegotiationMessage = z.infer<typeof negotiationMessageSchema>;
export type Negotiation = z.infer<typeof negotiationSchema>;

