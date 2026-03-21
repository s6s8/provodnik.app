import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { seededDestinations } from "@/data/destinations/seed";
import { seededPublicGuides } from "@/data/public-guides/seed";
import { seededPublicListings } from "@/data/public-listings/seed";
import { getSeededOpenRequests } from "@/data/open-requests/seed";
import { PublicDestinationDetailScreen } from "@/features/destinations/components/public/public-destination-detail-screen";

export const metadata: Metadata = {
  title: "Направление",
  description: "Откройте город: экскурсии, группы путешественников и локальные гиды.",
};

export default function DestinationDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const destination =
    seededDestinations.find((item) => item.slug === params.slug) ?? null;

  if (!destination) {
    notFound();
  }

  const normalizedName = destination.name.toLowerCase();
  const normalizedRegion = destination.region?.toLowerCase() ?? "";

  const listings = seededPublicListings.filter((listing) => {
    const city = listing.city.toLowerCase();
    const region = listing.region.toLowerCase();

    return (
      city.includes(normalizedName) ||
      normalizedName.includes(city) ||
      (normalizedRegion.length > 0 && region.includes(normalizedRegion)) ||
      (normalizedName === "байкал" && region.includes("иркут"))
    );
  });

  const requests = getSeededOpenRequests().filter((request) => {
    const destinationLabel = request.destinationLabel.toLowerCase();
    const regionLabel = request.regionLabel?.toLowerCase() ?? "";

    return (
      destinationLabel.includes(normalizedName) ||
      (normalizedRegion.length > 0 && regionLabel.includes(normalizedRegion))
    );
  });

  const guideSlugsFromListings = new Set(listings.map((listing) => listing.guideSlug));

  const guides = seededPublicGuides.filter((guide) => {
    const homeBase = guide.homeBase.toLowerCase();
    const matchesLocation =
      homeBase.includes(normalizedName) ||
      guide.regions.some((region) => {
        const normalizedGuideRegion = region.toLowerCase();
        return (
          normalizedGuideRegion.includes(normalizedName) ||
          (normalizedRegion.length > 0 &&
            normalizedGuideRegion.includes(normalizedRegion))
        );
      });

    return matchesLocation || guideSlugsFromListings.has(guide.slug);
  });

  return (
    <PublicDestinationDetailScreen
      destination={destination}
      requests={requests}
      listings={listings}
      guides={guides}
    />
  );
}
