import { describe, expect, it } from "vitest";

import type { RequestRecord } from "@/data/supabase/queries";

import { filterInbox } from "./guide-requests-inbox-filter";

const baseRequest: RequestRecord = {
  id: "req-1",
  destination: "Элиста, центр",
  destinationSlug: "elista",
  destinationRegion: "Калмыкия",
  title: "Тестовый запрос",
  dateLabel: "10 июня",
  startsOn: "2026-06-10",
  endsOn: null,
  startTime: null,
  endTime: null,
  groupSize: 2,
  capacity: 2,
  budgetRub: 0,
  budgetLabel: "—",
  requesterName: "Тест",
  requesterInitials: "Т",
  description: "",
  interests: [],
  mode: "assembly",
  format: "tour",
  status: "open",
  createdAt: "2026-01-01T00:00:00Z",
  offerCount: 0,
  imageUrl: "",
  members: [],
};

function request(overrides: Partial<RequestRecord>): RequestRecord {
  return { ...baseRequest, ...overrides };
}

describe("filterInbox", () => {
  it("restricts visible requests to the guide base city", () => {
    const items = [
      request({ id: "elista", destination: "Элиста, центр" }),
      request({ id: "karelia", destination: "Карелия, Рускеала" }),
    ];

    const filtered = filterInbox(items, {
      baseCity: "Элиста",
      cityFilter: "all",
      filter: "new",
      offeredIds: new Set(),
      sortKey: "newest",
      specializations: [],
    });

    expect(filtered.map((item) => item.id)).toEqual(["elista"]);
  });

  it("renders no requests when none match the guide base city", () => {
    const items = [
      request({ id: "elista", destination: "Элиста, центр" }),
      request({ id: "karelia", destination: "Карелия, Рускеала" }),
    ];

    const filtered = filterInbox(items, {
      baseCity: "Псков",
      cityFilter: "all",
      filter: "new",
      offeredIds: new Set(),
      sortKey: "newest",
      specializations: [],
    });

    expect(filtered).toEqual([]);
  });
});
