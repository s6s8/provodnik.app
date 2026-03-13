import type { Metadata } from "next";

import { seededPublicListings } from "@/data/public-listings/seed";
import { PublicListingDiscoveryScreen } from "@/features/listings/components/public/public-listing-discovery-screen";

export const metadata: Metadata = {
  title: "Экскурсии",
  description: "Готовые маршруты и экскурсии по России от проверенных гидов.",
};

export default function PublicListingsPage() {
  return <PublicListingDiscoveryScreen listings={seededPublicListings} />;
}

