export type PublicGuideTrustMarkerKey =
  | "emailVerified"
  | "phoneVerified"
  | "identityVerified"
  | "backgroundCheck"
  | "references";

export type PublicGuideReviewsSummary = {
  averageRating: number;
  totalReviews: number;
  lastReviewAt?: string;
};

export type PublicGuideProfile = {
  slug: string;
  displayName: string;
  headline: string;
  homeBase: string;
  avatarInitials?: string;
  avatarImageUrl?: string;
  yearsExperience: number;
  regions: readonly string[];
  languages: readonly string[];
  specialties: readonly string[];
  bio: string;
  trustMarkers: Record<PublicGuideTrustMarkerKey, boolean>;
  reviewsSummary: PublicGuideReviewsSummary;
};

