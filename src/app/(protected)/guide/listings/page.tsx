import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGuideListings } from "@/lib/supabase/listings";
import type { ListingRow } from "@/lib/supabase/types";
import { GuideListingsListScreen } from "@/features/guide/components/listings/guide-listings-list-screen";
import {
  publishListingAction,
  pauseListingAction,
  deleteListingAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Мои туры",
};

export default async function GuideListingsPage() {
  let listings: ListingRow[] = [];

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user?.id) {
      listings = await getGuideListings(session.user.id);
    }
  } catch {
    // Supabase not configured or session missing — render empty state
  }

  return (
    <GuideListingsListScreen
      initialListings={listings}
      actions={{
        publishAction: publishListingAction,
        pauseAction: pauseListingAction,
        deleteAction: deleteListingAction,
      }}
      showListingRejectionCard
    />
  );
}
