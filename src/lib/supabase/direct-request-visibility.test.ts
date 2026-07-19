import { describe, expect, it } from "vitest";

import { applyDirectVisibility } from "@/lib/supabase/queries";
import type { RequestRecord } from "@/lib/supabase/queries-core";

// Item 8: a request addressed to a specific guide (target_guide_id) is private.
function rec(id: string, targetGuideId: string | null): RequestRecord {
  return {
    id,
    travelerId: "traveler-1",
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
    createdAt: "2026-07-19",
    offerCount: 0,
    imageUrl: "x",
    members: [],
    targetGuideId,
  };
}

describe("applyDirectVisibility", () => {
  const rows = [rec("open", null), rec("to-a", "guide-a"), rec("to-b", "guide-b")];

  it("drops every directed request for public discovery (no viewer)", () => {
    const out = applyDirectVisibility(rows);
    expect(out.map((r) => r.id)).toEqual(["open"]);
    expect(out.every((r) => !r.isDirectToViewer)).toBe(true);
  });

  it("shows guide A their own directed request + open ones, flagged", () => {
    const out = applyDirectVisibility(rows, "guide-a");
    expect(out.map((r) => r.id).sort()).toEqual(["open", "to-a"]);
    const directed = out.find((r) => r.id === "to-a");
    expect(directed?.isDirectToViewer).toBe(true);
    // Never leak another guide's directed request.
    expect(out.some((r) => r.id === "to-b")).toBe(false);
  });

  it("never flags an open request as personal", () => {
    const out = applyDirectVisibility(rows, "guide-a");
    expect(out.find((r) => r.id === "open")?.isDirectToViewer).toBeFalsy();
  });
});
