import type { OpenRequestRecord } from "@/data/open-requests/types";
import type { PublicListing } from "@/data/public-listings/types";

function normalizePart(value: string | null | undefined): string {
  return (value ?? "").trim();
}

/** Lower-cased, blank-stripped search haystack for public discovery filters. */
export function buildDiscoverySearchHaystack(
  parts: Iterable<string | null | undefined>,
): string {
  return [...parts]
    .map((part) => normalizePart(part))
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("ru");
}

export function matchesDiscoveryQuery(haystack: string, query: string): boolean {
  const normalizedQuery = query.trim().toLocaleLowerCase("ru");
  if (!normalizedQuery) return true;
  return haystack.includes(normalizedQuery);
}

/** Trailing destination segments after the city, e.g. «Казань, Свияжск» → «Свияжск». */
export function namedLocationsFromDestination(destination: string): string[] {
  const parts = destination
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length <= 1) return [];
  return parts.slice(1);
}

export function uniqueNamedLocations(
  labels: Iterable<string | null | undefined>,
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const label of labels) {
    const trimmed = normalizePart(label);
    if (!trimmed) continue;
    const key = trimmed.toLocaleLowerCase("ru");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

export function getListingDiscoverySearchText(
  listing: Pick<
    PublicListing,
    "title" | "highlights" | "city" | "region" | "locationLabels"
  >,
): string {
  return buildDiscoverySearchHaystack([
    listing.title,
    listing.highlights.join(" "),
    listing.city,
    listing.region,
    ...listing.locationLabels,
  ]);
}

// Free-text search must match what the placeholder promises: город, регион, локация.
// destinationLabel carries the city; regionLabel the region (may be empty).
// locationLabels carry named places that are public on the card projection.
export function getRequestDiscoverySearchText(
  request: Pick<
    OpenRequestRecord,
    "destinationLabel" | "regionLabel" | "highlights" | "locationLabels"
  >,
): string {
  return buildDiscoverySearchHaystack([
    request.destinationLabel,
    request.regionLabel,
    ...request.highlights,
    ...(request.locationLabels ?? []),
  ]);
}
