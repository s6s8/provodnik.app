import { describe, expect, it } from "vitest";

import {
  formatGuideRegionsInput,
  parseGuideRegionsInput,
} from "./guide-regions";

describe("parseGuideRegionsInput", () => {
  it("keeps spaces inside a single region name", () => {
    expect(parseGuideRegionsInput("Санкт Петербург")).toEqual(["Санкт Петербург"]);
  });

  it("splits on commas and trims each region", () => {
    expect(parseGuideRegionsInput("Санкт Петербург, Республика Карелия")).toEqual([
      "Санкт Петербург",
      "Республика Карелия",
    ]);
  });

  it("ignores empty segments from trailing commas", () => {
    expect(parseGuideRegionsInput("Карелия, ")).toEqual(["Карелия"]);
  });
});

describe("formatGuideRegionsInput", () => {
  it("joins stored regions for the text field", () => {
    expect(formatGuideRegionsInput(["Санкт Петербург", "Карелия"])).toBe(
      "Санкт Петербург, Карелия",
    );
  });
});
