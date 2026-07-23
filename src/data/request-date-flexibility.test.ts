import { describe, expect, it } from "vitest";

import {
  isFlexibleDateFlexibility,
  isOfferDateLocked,
  isOfferTimeLocked,
  resolveGuideRequestFlexibilityPresentation,
  resolveRequestFlexibilityPresentation,
} from "./request-date-flexibility";

describe("isFlexibleDateFlexibility", () => {
  it("treats few_days as flexible", () => {
    expect(isFlexibleDateFlexibility("few_days")).toBe(true);
  });

  it("treats exact and missing values as fixed", () => {
    expect(isFlexibleDateFlexibility("exact")).toBe(false);
    expect(isFlexibleDateFlexibility(null)).toBe(false);
    expect(isFlexibleDateFlexibility(undefined)).toBe(false);
  });
});

describe("resolveRequestFlexibilityPresentation", () => {
  it("hides the clock range when dates are flexible", () => {
    expect(
      resolveRequestFlexibilityPresentation({
        dateFlexibility: "few_days",
        startTime: "10:00",
        endTime: "18:00",
      }),
    ).toEqual({
      datesFlexible: true,
      timeFlexible: true,
      timeLabel: undefined,
    });
  });

  it("keeps a fixed time range for exact requests", () => {
    expect(
      resolveRequestFlexibilityPresentation({
        dateFlexibility: "exact",
        startTime: "10:00",
        endTime: "18:00",
      }),
    ).toEqual({
      datesFlexible: false,
      timeFlexible: false,
      timeLabel: "10:00–18:00",
    });
  });

  it("omits timeLabel when an exact request has no start time", () => {
    expect(
      resolveRequestFlexibilityPresentation({
        dateFlexibility: "exact",
        startTime: null,
        endTime: null,
      }),
    ).toEqual({
      datesFlexible: false,
      timeFlexible: false,
      timeLabel: undefined,
    });
  });
});

describe("resolveGuideRequestFlexibilityPresentation", () => {
  it("treats an unlocked time flag as flexible presentation on exact dates", () => {
    expect(
      resolveGuideRequestFlexibilityPresentation({
        dateFlexibility: "exact",
        startTime: "10:00",
        endTime: "18:00",
        time_locked: false,
      }),
    ).toEqual({
      datesFlexible: false,
      timeFlexible: true,
      timeLabel: undefined,
    });
  });
});

describe("offer lock helpers", () => {
  it("unlocks date and time for few_days requests", () => {
    expect(isOfferDateLocked({ date_flexibility: "few_days" })).toBe(false);
    expect(isOfferTimeLocked({ date_flexibility: "few_days", time_locked: true })).toBe(
      false,
    );
  });

  it("defaults time lock to true for exact requests", () => {
    expect(isOfferDateLocked({ date_flexibility: "exact" })).toBe(true);
    expect(isOfferTimeLocked({ date_flexibility: "exact" })).toBe(true);
    expect(isOfferTimeLocked({ date_flexibility: "exact", time_locked: false })).toBe(
      false,
    );
  });
});
