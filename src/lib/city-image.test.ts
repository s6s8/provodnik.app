import { describe, expect, it } from "vitest";

import { cityImage } from "./city-image";

describe("cityImage", () => {
  it("returns a deterministic online placeholder URL for a destination", () => {
    const first = cityImage("Элиста");
    const second = cityImage("Элиста");

    expect(first).toBe(second);
    expect(first).toMatch(/^https:\/\/images\.unsplash\.com\//);
  });

  it("normalizes destination case and surrounding whitespace", () => {
    expect(cityImage("  ЭЛИСТА  ")).toBe(cityImage("элиста"));
  });
});
