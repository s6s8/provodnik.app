import type { RequestRecord } from "@/data/supabase/queries";

export type GuideRequestsFilter = "new" | "my-offers";
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
  }

  // form-epic #8: baseCity filter (Phase A). If guide's base_city is set,
  // restrict inbox to requests whose first destination segment matches
  // (case-insensitive). If base_city is null, leave items untouched —
  // empty-state with profile-fill hint is rendered downstream.
  if (baseCity) {
    const norm = baseCity.trim().toLowerCase();
    filtered = filtered.filter(
      (item) => item.destination.split(",")[0].trim().toLowerCase() === norm,
    );
  }

  // City filter (user-driven dropdown, separate from baseCity Phase A scope)
  if (cityFilter !== "all") {
    filtered = filtered.filter(
      (item) => item.destination.split(",")[0].trim() === cityFilter,
    );
  }

  filtered = filtered.filter((item) =>
    isMatchedRequest(item, specializations),
  );

  // Sort
  if (sortKey === "newest") {
    filtered = [...filtered].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  } else if (sortKey === "date") {
    filtered = [...filtered].sort((a, b) =>
      a.dateLabel.localeCompare(b.dateLabel),
    );
  } else if (sortKey === "size") {
    filtered = [...filtered].sort((a, b) => b.groupSize - a.groupSize);
  }

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
