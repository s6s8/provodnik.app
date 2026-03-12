export type ListingVisibility =
  | "draft"
  | "published"
  | "hidden"
  | "blocked"
  | "needs-changes";

export type ListingRiskKey =
  | "newSeller"
  | "priceOutlier"
  | "duplicateContent"
  | "keywordSpam"
  | "geoMismatch"
  | "riskyMedia";

export type ModerationAction =
  | "pending"
  | "approve"
  | "hide"
  | "block"
  | "request-changes";

export type ListingPolicyNoteKey =
  | "allowed"
  | "needs-review"
  | "restricted"
  | "disallowed";

export type ListingPolicyNote = {
  key: ListingPolicyNoteKey;
  title: string;
  detail: string;
};

export type ModerationListing = {
  id: string;
  submittedAt: string;
  listing: {
    title: string;
    category: string;
    location: string;
    language: readonly string[];
    price: { amount: number; currency: string };
    sellerDisplayName: string;
  };
  visibility: ListingVisibility;
  riskSignals: Record<ListingRiskKey, boolean>;
  riskReasons: readonly string[];
  policyNotes: readonly ListingPolicyNote[];
  excerpt: string;
};

