export type QualityTier = "strong" | "watch" | "risk";

export type MarketplaceQualitySnapshot = {
  responseTimeHours: number;
  completionRate: number;
  cancellationRate: number;
  tier: QualityTier;
  visibilityLabel: string;
  visibilityNote: string;
};

const GUIDE_QUALITY_BY_SLUG: Record<string, MarketplaceQualitySnapshot> = {
  "maria-rostov": {
    responseTimeHours: 1.6,
    completionRate: 98,
    cancellationRate: 1,
    tier: "strong",
    visibilityLabel: "Priority visibility",
    visibilityNote:
      "Fast replies and near-zero cancellations keep this guide higher in discovery and request routing.",
  },
  "elena-kazan": {
    responseTimeHours: 3.8,
    completionRate: 95,
    cancellationRate: 3,
    tier: "watch",
    visibilityLabel: "Healthy but watched",
    visibilityNote:
      "Supply remains visible, but slower response windows are more likely to lose ranking to faster guides.",
  },
  "artem-sochi": {
    responseTimeHours: 7.4,
    completionRate: 89,
    cancellationRate: 6,
    tier: "risk",
    visibilityLabel: "At-risk visibility",
    visibilityNote:
      "Long response times and elevated cancellations suppress distribution until consistency improves.",
  },
};

const LISTING_QUALITY_BY_SLUG: Record<string, MarketplaceQualitySnapshot> = {
  "rostov-river-port-evening-walk": {
    responseTimeHours: 1.8,
    completionRate: 97,
    cancellationRate: 2,
    tier: "strong",
    visibilityLabel: "Strong listing lift",
    visibilityNote:
      "This itinerary inherits a high-trust guide profile and stays eligible for stronger discovery placement.",
  },
  "kazan-food-walk-hidden-tea-rooms": {
    responseTimeHours: 3.2,
    completionRate: 94,
    cancellationRate: 3,
    tier: "watch",
    visibilityLabel: "Competitive, not dominant",
    visibilityNote:
      "Solid quality keeps it searchable, but it may rank behind faster supply during busy demand windows.",
  },
  "sochi-off-season-photo-route": {
    responseTimeHours: 6.8,
    completionRate: 90,
    cancellationRate: 5,
    tier: "risk",
    visibilityLabel: "Needs quality recovery",
    visibilityNote:
      "The marketplace reduces exposure when response and completion consistency fall below the preferred band.",
  },
};

const DEFAULT_GUIDE_QUALITY: MarketplaceQualitySnapshot = {
  responseTimeHours: 2.5,
  completionRate: 95,
  cancellationRate: 3,
  tier: "watch",
  visibilityLabel: "Neutral visibility",
  visibilityNote:
    "Discovery stays healthy when replies are fast, trips complete reliably, and cancellations remain rare.",
};

export function getGuideQualitySnapshot(slug: string): MarketplaceQualitySnapshot {
  return GUIDE_QUALITY_BY_SLUG[slug] ?? DEFAULT_GUIDE_QUALITY;
}

export function getListingQualitySnapshot(slug: string): MarketplaceQualitySnapshot {
  return LISTING_QUALITY_BY_SLUG[slug] ?? DEFAULT_GUIDE_QUALITY;
}
