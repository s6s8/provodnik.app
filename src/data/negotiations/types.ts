import type { Negotiation } from "@/data/negotiations/schema";

export type NegotiationRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  negotiation: Negotiation;
};

