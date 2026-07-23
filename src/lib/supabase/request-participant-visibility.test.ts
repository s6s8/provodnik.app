import { describe, expect, it } from "vitest";

import {
  canSeeRequestParticipantCount,
  formatGuideInboxBudgetLine,
  formatGuideRequestGroupLabel,
} from "./request-participant-visibility";

describe("canSeeRequestParticipantCount", () => {
  it("allows assembly participant counts for any guide browsing the inbox", () => {
    expect(
      canSeeRequestParticipantCount(
        { mode: "assembly" },
        { kind: "guide", hasSubmittedOffer: false, isAddressedGuide: false },
      ),
    ).toBe(true);
  });

  it("withholds closed-request participants from an unrelated guide", () => {
    expect(
      canSeeRequestParticipantCount(
        { mode: "private" },
        { kind: "guide", hasSubmittedOffer: false, isAddressedGuide: false },
      ),
    ).toBe(false);
  });

  it("shows closed-request participants to the addressed guide", () => {
    expect(
      canSeeRequestParticipantCount(
        { mode: "private" },
        { kind: "guide", hasSubmittedOffer: false, isAddressedGuide: true },
      ),
    ).toBe(true);
  });

  it("shows closed-request participants to a guide who already responded", () => {
    expect(
      canSeeRequestParticipantCount(
        { mode: "private" },
        { kind: "guide", hasSubmittedOffer: true, isAddressedGuide: false },
      ),
    ).toBe(true);
  });

  it("keeps the owner and admin paths open", () => {
    expect(canSeeRequestParticipantCount({ mode: "private" }, { kind: "owner" })).toBe(
      true,
    );
    expect(canSeeRequestParticipantCount({ mode: "private" }, { kind: "admin" })).toBe(
      true,
    );
  });
});

describe("formatGuideInboxBudgetLine", () => {
  it("omits the headcount for unauthorized closed-request readers", () => {
    expect(
      formatGuideInboxBudgetLine({ budgetLabel: "3 000 ₽ / чел.", groupSize: 4 }, false),
    ).toBe("3 000 ₽ / чел.");
  });

  it("keeps the headcount when the viewer is authorized", () => {
    expect(
      formatGuideInboxBudgetLine({ budgetLabel: "3 000 ₽ / чел.", groupSize: 4 }, true),
    ).toBe("3 000 ₽ / чел. · 4 чел.");
  });
});

describe("formatGuideRequestGroupLabel", () => {
  it("labels a closed request without exposing participants to unauthorized guides", () => {
    expect(formatGuideRequestGroupLabel({ mode: "private", groupSize: 5 }, false)).toBe(
      "Своя группа",
    );
  });

  it("shows participants on a closed request for authorized guides", () => {
    expect(formatGuideRequestGroupLabel({ mode: "private", groupSize: 5 }, true)).toBe(
      "Своя группа · 5 чел.",
    );
  });
});
