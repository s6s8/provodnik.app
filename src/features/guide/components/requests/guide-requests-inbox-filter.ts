import type { RequestRecord } from "@/data/supabase/queries";

export type GuideRequestsFilter = "new" | "my-offers" | "confirmed";
export type GuideRequestsSortKey = "newest" | "date" | "size";

interface FilterInboxOptions {
  baseCity: string | null;
  cityFilter: string;
  filter: GuideRequestsFilter;
  offeredIds: Set<string>;
  sortKey: GuideRequestsSortKey;
  specializations: string[];
}

export function isMatchedRequest(req: { interests: string[] }, specs: string[]): boolean {
  if (specs.length === 0) return false;
  for (const i of req.interests) if (specs.includes(i)) return true;
  return false;
}

export function filterInbox(
  items: RequestRecord[],
  {
    baseCity,
    cityFilter,
    filter,
    offeredIds,
    sortKey,
    specializations,
  }: FilterInboxOptions,
): RequestRecord[] {
  let filtered = items;

  // Tab filter
  if (filter === "new") {
    filtered = filtered.filter(
      (item) => !offeredIds.has(item.id),
    );
  } else if (filter === "my-offers") {
    filtered = filtered.filter(
      (item) => offeredIds.has(item.id),
    );
  } else if (filter === "confirmed") {
    return [];
  }

  // form-epic #8: baseCity filter (Phase A). If guide's base_city is set,
  // restrict inbox to requests whose first destination segment matches
  // (case-insensitive). If base_city is null, leave items untouched —
  // empty-state with profile-fill hint is rendered downstream.
  // A request addressed directly to this guide (item 9) always belongs in their inbox,
  // regardless of city or specialization scoping below.
  if (baseCity) {
    const norm = baseCity.trim().toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.isDirectToViewer ||
        item.destination.split(",")[0].trim().toLowerCase() === norm,
    );
  }

  // City filter (user-driven dropdown, separate from baseCity Phase A scope)
  if (cityFilter !== "all") {
    filtered = filtered.filter(
      (item) =>
        item.isDirectToViewer || item.destination.split(",")[0].trim() === cityFilter,
    );
  }

  // Sort
  if (sortKey === "newest") {
    filtered = [...filtered].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  } else if (sortKey === "date") {
    filtered = [...filtered].sort((a, b) => a.dateLabel.localeCompare(b.dateLabel));
  } else if (sortKey === "size") {
    filtered = [...filtered].sort((a, b) => b.groupSize - a.groupSize);
  }

  // Hard filter: show only requests whose topics match the guide's specializations.
  // Guarded so guides with no specializations still see all open requests. Directed
  // requests (item 9) are exempt — they are addressed to this guide by name.
  if (specializations.length > 0) {
    filtered = filtered.filter(
      (item: RequestRecord) =>
        item.isDirectToViewer || isMatchedRequest(item, specializations),
    );
  }

  // Item 9: personal requests visually prioritized — float above equally-new general
  // requests while preserving the chosen sort order within each group (stable sort).
  filtered = [...filtered].sort(
    (a, b) => Number(Boolean(b.isDirectToViewer)) - Number(Boolean(a.isDirectToViewer)),
  );

  return filtered;
}

type InboxScopeOptions = Omit<FilterInboxOptions, "filter">;

export function getInboxTabCounts(
  items: RequestRecord[],
  options: InboxScopeOptions,
): { newCount: number; myOffersCount: number } {
  return {
    newCount: filterInbox(items, { ...options, filter: "new" }).length,
    myOffersCount: filterInbox(items, { ...options, filter: "my-offers" }).length,
  };
}
