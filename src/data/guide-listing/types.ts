import type { GuideListing } from "@/data/guide-listing/schema";

export type GuideListingStatus = GuideListing["status"];

export type GuideListingRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  listing: GuideListing;
};

export type GuideListingManagerItem = {
  id: string;
  title: string;
  region: string;
  durationHours: number;
  capacity: number;
  priceRub: number;
  pricingMode: GuideListing["pricing"]["mode"];
  status: GuideListingStatus;
  updatedAt: string;
};

