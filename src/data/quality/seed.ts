export type QualityTier = "strong" | "watch" | "risk";

export type MarketplaceQualitySnapshot = {
  responseTimeHours: number;
  completionRate: number;
  cancellationRate: number;
  tier: QualityTier;
  visibilityLabel: string;
  visibilityNote: string;
};

