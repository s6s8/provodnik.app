import type { ListingRow } from "@/lib/supabase/types";

import { ListingCard } from "@/components/traveler/ListingCard";

export type FeaturedGridListing = Pick<
  ListingRow,
  | "id"
  | "title"
  | "region"
  | "city"
  | "exp_type"
  | "price_from_minor"
  | "duration_minutes"
  | "average_rating"
  | "image_url"
  | "featured_rank"
>;

interface Props {
  listings: FeaturedGridListing[];
}

export function FeaturedGrid({ listings }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
