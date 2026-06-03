import { describe, expect, it } from "vitest";

import { formatRussianDateRange } from "./dates";

describe("formatRussianDateRange", () => {
  it("returns an empty label for invalid ISO dates", () => {
    expect(formatRussianDateRange("not-a-date")).toBe("");
    expect(formatRussianDateRange("2026-02-30")).toBe("");
  });

  it("ignores an invalid end date instead of formatting NaN", () => {
    expect(formatRussianDateRange("2026-05-15", "2026-13-40")).toBe("15 мая");
  });
});
