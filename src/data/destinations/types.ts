/**
 * Destination aggregation: city/region for discovery and destination pages.
 * Used by home, requests board, and /destinations/[slug].
 */

export type DestinationSlug = string;

export type DestinationSummary = {
  slug: DestinationSlug;
  name: string;
  region?: string;
  /** Optional cover image URL for cards and hero */
  imageUrl?: string;
  /** Optional short destination description for cards and previews */
  description?: string;
  /** Count of public listings for this destination (optional, for UI) */
  listingCount?: number;
  /** Count of open requests for this destination (optional, for UI) */
  openRequestCount?: number;
};

export type DestinationDetail = DestinationSummary & {
  /** Optional list of experience types commonly offered (e.g. city, nature) */
  experienceTypes?: string[];
};
