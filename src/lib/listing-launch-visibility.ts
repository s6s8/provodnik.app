import { flags } from "@/lib/flags";
import type { ListingRecord } from "@/lib/supabase/queries-core";

/** Whether a `listings` row may appear on public discovery surfaces at launch. */
export function isListingExpTypeLaunchVisible(
  expType: string | null | undefined,
): boolean {
  if (expType === "transfer") return false;
  if (expType === "tour" && !flags.FEATURE_TR_TOURS) return false;
  return true;
}

/** Whether ready-excursion (`guide_templates`) cards and routes are public at launch. */
export function isReadyExcursionLaunchVisible(): boolean {
  return flags.FEATURE_PUBLIC_CATALOG;
}

export function filterLaunchVisibleListingRows(
  rows: Record<string, unknown>[],
): Record<string, unknown>[] {
  return rows.filter((row) =>
    isListingExpTypeLaunchVisible(row.exp_type as string | null | undefined),
  );
}

export function filterLaunchVisibleListings(
  listings: ListingRecord[],
): ListingRecord[] {
  return listings.filter((listing) => {
    if (listing.detailHref?.startsWith("/excursions/")) {
      return isReadyExcursionLaunchVisible();
    }
    return isListingExpTypeLaunchVisible(listing.expType);
  });
}
