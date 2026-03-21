/**
 * Negotiation (offer/counter) timeline for a traveler request.
 * Complements TravelerOffer and guide-offer schema; used for request-detail and guide-offer UIs.
 */

export type NegotiationParty = "guide" | "traveler_group";

export type NegotiationEventKind =
  | "offer_sent"
  | "counter_sent"
  | "offer_accepted"
  | "offer_declined"
  | "offer_expired";

export type NegotiationTimelineEvent = {
  id: string;
  requestId: string;
  offerId?: string;
  at: string;
  kind: NegotiationEventKind;
  party: NegotiationParty;
  /** Price in RUB at this step (for offer_sent / counter_sent) */
  priceTotalRub?: number;
  /** Free-text note from the party */
  note?: string;
};

export type NegotiationOfferState = "pending" | "countered" | "accepted" | "declined" | "expired";
