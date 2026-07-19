import { describe, expect, it } from "vitest";
import { getQueryText } from "./public-requests-marketplace-screen";
import type { OpenRequestRecord } from "@/data/open-requests/types";

// Guards Req 5: the «город, регион, локация» placeholder must be truthful —
// search must match city (destinationLabel), region (regionLabel), and stay
// sane when the region is empty.
function makeRecord(overrides: Partial<OpenRequestRecord>): OpenRequestRecord {
  return {
    id: "r1",
    status: "open",
    visibility: "public",
    createdAt: "2026-07-19",
    updatedAt: "2026-07-19",
    travelerRequestId: "tr1",
    group: { sizeTarget: 4, sizeCurrent: 1, openToMoreMembers: true },
    destinationLabel: "Казань",
    regionLabel: "Татарстан",
    dateRangeLabel: "август",
    highlights: ["Экскурсия по кремлю", "Уютная прогулка"],
    ...overrides,
  };
}

describe("getQueryText", () => {
  it("matches by city (destinationLabel)", () => {
    const text = getQueryText(makeRecord({ destinationLabel: "Казань" }));
    expect(text).toContain("казань");
  });

  it("matches by region (regionLabel)", () => {
    const text = getQueryText(makeRecord({ regionLabel: "Татарстан" }));
    expect(text).toContain("татарстан");
  });

  it("keeps highlights searchable (location/details)", () => {
    const text = getQueryText(makeRecord({ highlights: ["Свияжск остров"] }));
    expect(text).toContain("свияжск");
  });

  it("stays clean when the region is empty (no spurious blank token match)", () => {
    const text = getQueryText(
      makeRecord({ destinationLabel: "Сочи", regionLabel: "", highlights: ["Море"] }),
    );
    expect(text).toBe("сочи море");
    // An empty query segment must never make everything match.
    expect(text.includes("  ")).toBe(false);
  });
});
