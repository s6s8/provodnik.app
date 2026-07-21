import { describe, expect, it } from "vitest";

import { MAX_REQUEST_PARTICIPANTS, travelerRequestSchema } from "@/data/traveler-request/schema";
import { submitRequestSchema } from "@/features/bookings/actions/submitRequest.schema";
import { createRequestInputSchema } from "@/lib/supabase/requests";

// D21-2: one traveler request permits at most 50 travelers. Every authoritative
// boundary (form UX, canonical server create, listing entry point) must agree.

const formBase = {
  mode: "private" as const,
  interests: ["history_culture"],
  destination: "Москва",
  startDate: "2026-05-10",
  dateFlexibility: "exact" as const,
  startTime: "10:00",
  endTime: "18:00",
  allowGuideSuggestionsOutsideConstraints: true,
  budgetPerPersonRub: 1500,
  notes: "",
};

const serverBase = {
  destination: "Москва",
  starts_on: "2026-05-10",
  ends_on: "2026-05-10",
};

const submitBase = {
  listingId: "11111111-1111-4111-8111-111111111111",
  guideId: "22222222-2222-4222-8222-222222222222",
  destination: "Москва",
  region: "Москва",
  category: "history_culture",
  startsOn: "2026-05-10",
};

describe("traveler request participant limit", () => {
  it("caps at 50", () => {
    expect(MAX_REQUEST_PARTICIPANTS).toBe(50);
  });

  it("accepts 50 travelers at every boundary", () => {
    expect(travelerRequestSchema.safeParse({ ...formBase, groupSize: 50 }).success).toBe(true);
    expect(
      travelerRequestSchema.safeParse({
        ...formBase,
        mode: "assembly",
        groupSizeCurrent: 50,
      }).success,
    ).toBe(true);
    expect(
      createRequestInputSchema.safeParse({ ...serverBase, participants_count: 50 }).success,
    ).toBe(true);
    expect(submitRequestSchema.safeParse({ ...submitBase, participantsCount: 50 }).success).toBe(
      true,
    );
  });

  it("rejects 51 travelers at every boundary with a Russian message", () => {
    for (const result of [
      travelerRequestSchema.safeParse({ ...formBase, groupSize: 51 }),
      travelerRequestSchema.safeParse({ ...formBase, mode: "assembly", groupSizeCurrent: 51 }),
      createRequestInputSchema.safeParse({ ...serverBase, participants_count: 51 }),
      submitRequestSchema.safeParse({ ...submitBase, participantsCount: 51 }),
    ]) {
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("Максимум 50 путешественников.");
      }
    }
  });

  it("still accepts 1 traveler and rejects 0", () => {
    expect(
      createRequestInputSchema.safeParse({ ...serverBase, participants_count: 1 }).success,
    ).toBe(true);
    expect(
      createRequestInputSchema.safeParse({ ...serverBase, participants_count: 0 }).success,
    ).toBe(false);
  });
});
