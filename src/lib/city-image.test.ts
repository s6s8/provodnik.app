import { describe, expect, it } from "vitest";

import { brandGradient, cityImage } from "./city-image";

describe("brandGradient", () => {
  it("returns an on-canon inline SVG gradient, never foreign stock", () => {
    const result = brandGradient("listings");

    expect(result).toMatch(/^data:image\/svg\+xml,/);
    expect(result).not.toContain("unsplash.com");
  });

  it("is deterministic — same seed yields identical output", () => {
    expect(brandGradient("listings")).toBe(brandGradient("listings"));
  });

  it("varies the gradient across different seeds", () => {
    expect(brandGradient("listings")).not.toBe(brandGradient("guides"));
  });

  it("defaults to a stable branded seed when none is given", () => {
    expect(brandGradient()).toBe(brandGradient("provodnik"));
  });

  it("stays on the canon navy/amber palette", () => {
    const decoded = decodeURIComponent(brandGradient("search"));

    expect(decoded).toContain("#1A56A4");
    expect(decoded).toContain("#15467F");
    expect(decoded).toContain("#D4872B");
  });
});

describe("cityImage", () => {
  it("returns an on-canon inline SVG gradient, never foreign stock", () => {
    const result = cityImage("Элиста");

    expect(result).toMatch(/^data:image\/svg\+xml,/);
    expect(result).not.toContain("unsplash.com");
  });

  it("is deterministic — same input yields identical output", () => {
    expect(cityImage("Элиста")).toBe(cityImage("Элиста"));
  });

  it("normalizes destination case and surrounding whitespace", () => {
    expect(cityImage("  ЭЛИСТА  ")).toBe(cityImage("элиста"));
  });

  it("varies the gradient across different destinations", () => {
    expect(cityImage("Элиста")).not.toBe(cityImage("Казань"));
  });

  it("stays on the canon navy/amber palette (no off-palette colors)", () => {
    const decoded = decodeURIComponent(cityImage("Дербент"));

    expect(decoded).toContain("#1A56A4");
    expect(decoded).toContain("#15467F");
    expect(decoded).toContain("#D4872B");
  });
});
