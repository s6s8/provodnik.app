import { describe, expect, it, vi } from "vitest";

import type { TravelerRequest } from "@/data/traveler-request/schema";

vi.mock("@/lib/notifications/triggers", () => ({
  notifyGuidesNewRequest: vi.fn(),
}));

import { buildRequestInsertPayload } from "./actions";

const baseInput: TravelerRequest = {
  mode: "private",
  interests: ["history"],
  destination: "Элиста",
  startDate: "2026-09-10",
  dateFlexibility: "exact",
  startTime: "",
  endTime: "",
  groupSize: 4,
  groupSizeCurrent: undefined,
  groupMax: undefined,
  allowGuideSuggestionsOutsideConstraints: true,
  budgetPerPersonRub: 5000,
  notes: "",
};

describe("buildRequestInsertPayload", () => {
  it("writes date_locked=false, time_locked=false when allowGuideSuggestions=true", async () => {
    const payload = await buildRequestInsertPayload(baseInput, { allowGuideSuggestions: true });

    expect(payload.date_locked).toBe(false);
    expect(payload.time_locked).toBe(false);
  });

  it("writes date_locked=true, time_locked=true when allowGuideSuggestions=false", async () => {
    const payload = await buildRequestInsertPayload(baseInput, { allowGuideSuggestions: false });

    expect(payload.date_locked).toBe(true);
    expect(payload.time_locked).toBe(true);
  });

  it("does not include allow_guide_suggestions in the payload", async () => {
    const payload = await buildRequestInsertPayload(baseInput, { allowGuideSuggestions: true });

    expect(payload).not.toHaveProperty("allow_guide_suggestions");
  });

  it("does not include group_capacity in the payload", async () => {
    const payload = await buildRequestInsertPayload(
      {
        ...baseInput,
        mode: "assembly",
        groupSizeCurrent: 2,
        groupMax: 6,
        groupSize: undefined,
      },
      { allowGuideSuggestions: false },
    );

    expect(payload).not.toHaveProperty("group_capacity");
  });

  it("rubToKopecks conversion is applied to budget_minor", async () => {
    const payload = await buildRequestInsertPayload(
      { ...baseInput, budgetPerPersonRub: 5000 },
      { allowGuideSuggestions: false },
    );

    expect(payload.budget_minor).toBe(500_000);
  });
});
