import { describe, expect, it } from "vitest";

import { cityImage } from "./city-image";

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
