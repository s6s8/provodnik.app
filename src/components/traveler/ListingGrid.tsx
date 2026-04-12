import { ListingCard } from "@/components/traveler/ListingCard";
import type { ListingRow } from "@/lib/supabase/types";

type ListingGridProps = {
  listings: ListingRow[];
};

export function ListingGrid({ listings }: ListingGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
