export type VerificationState =
  | "missing"
  | "uploaded"
  | "needs-review"
  | "verified"
  | "rejected";

export type TrustSignalKey =
  | "emailVerified"
  | "phoneVerified"
  | "identityVerified"
  | "backgroundCheck"
  | "references";

export type GuideApplicationDecision =
  | "pending"
  | "approved"
  | "needs-more-info"
  | "rejected";

export type GuideApplicationDocument = {
  key: "identity" | "selfie" | "address" | "certification";
  label: string;
  state: VerificationState;
};

export type GuideApplication = {
  id: string;
  submittedAt: string;
  applicant: {
    displayName: string;
    homeBase: string;
    languages: readonly string[];
    yearsExperience: number;
  };
  trustSignals: Record<TrustSignalKey, boolean>;
  documents: readonly GuideApplicationDocument[];
  flags: readonly string[];
  summary: string;
};

