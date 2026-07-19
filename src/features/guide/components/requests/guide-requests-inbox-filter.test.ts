import { describe, expect, it } from "vitest";

import { filterInbox } from "./guide-requests-inbox-filter";
import type { RequestRecord } from "@/data/supabase/queries";

function rec(overrides: Partial<RequestRecord> & { id: string }): RequestRecord {
  return {
    travelerId: "t",
    destination: "Казань",
    destinationSlug: "kazan",
    destinationRegion: "",
    title: "Казань",
    dateLabel: "август",
    groupSize: 2,
    capacity: null,
    budgetRub: 0,
    budgetLabel: "не указан",
    requesterName: "П",
    requesterInitials: "П",
    description: "",
    interests: [],
    mode: "assembly",
    format: "group",
    status: "open",
    createdAt: "2026-07-10T00:00:00Z",
    offerCount: 0,
    imageUrl: "x",
    members: [],
    ...overrides,
  };
}

const base = {
  baseCity: "Москва",
  cityFilter: "all",
  filter: "new" as const,
  offeredIds: new Set<string>(),
  sortKey: "newest" as const,
  specializations: ["nature"],
};

describe("filterInbox — direct requests (item 9)", () => {
  it("keeps a personal request even when city and specialization would exclude it", () => {
    const items = [
      rec({ id: "direct", destination: "Сочи", interests: ["history_culture"], isDirectToViewer: true }),
    ];
    const out = filterInbox(items, base);
    expect(out.map((i) => i.id)).toEqual(["direct"]);
  });

  it("floats personal requests above equally-new general ones", () => {
    const items = [
      rec({ id: "general-new", destination: "Москва", interests: ["nature"], createdAt: "2026-07-19T00:00:00Z" }),
      rec({ id: "direct", destination: "Москва", interests: ["nature"], createdAt: "2026-07-01T00:00:00Z", isDirectToViewer: true }),
    ];
    const out = filterInbox(items, base);
    expect(out[0].id).toBe("direct");
  });

  it("still excludes a general request that fails the city filter", () => {
    const items = [rec({ id: "away", destination: "Сочи", interests: ["nature"] })];
    expect(filterInbox(items, base)).toHaveLength(0);
  });
});
