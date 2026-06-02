import { describe, expect, it } from "vitest";

import { isGuideProfileConfirmed } from "./guide-verification";

describe("isGuideProfileConfirmed", () => {
  it("returns true only for approved verification status", () => {
    expect(isGuideProfileConfirmed("approved")).toBe(true);
  });

  it("returns false for draft, submitted, rejected, and missing status", () => {
    expect(isGuideProfileConfirmed("draft")).toBe(false);
    expect(isGuideProfileConfirmed("submitted")).toBe(false);
    expect(isGuideProfileConfirmed("rejected")).toBe(false);
    expect(isGuideProfileConfirmed(null)).toBe(false);
    expect(isGuideProfileConfirmed(undefined)).toBe(false);
  });

  it("does not treat guide role as confirmation", () => {
    expect(isGuideProfileConfirmed("guide")).toBe(false);
  });
});
