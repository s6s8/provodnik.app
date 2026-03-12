import type { Metadata } from "next";

import { seededPublicListings } from "@/data/public-listings/seed";
import { PublicListingDiscoveryScreen } from "@/features/listings/components/public/public-listing-discovery-screen";

export const metadata: Metadata = {
  title: "Listings",
  description: "Explore seeded tour listings for the public MVP baseline.",
};

export default function PublicListingsPage() {
  return <PublicListingDiscoveryScreen listings={seededPublicListings} />;
}

