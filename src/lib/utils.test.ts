import { describe, expect, it } from "vitest";

import { arrowizeRoute, pluralizePeopleGenitive } from "./utils";

describe("pluralizePeopleGenitive", () => {
  it("returns the genitive forms used after a number", () => {
    expect(pluralizePeopleGenitive(1)).toBe("человека");
    expect(pluralizePeopleGenitive(2)).toBe("человек");
    expect(pluralizePeopleGenitive(5)).toBe("человек");
    expect(pluralizePeopleGenitive(11)).toBe("человек");
    expect(pluralizePeopleGenitive(21)).toBe("человека");
  });
});

describe("arrowizeRoute", () => {
  it("replaces ASCII arrows with → and normalizes spacing", () => {
    expect(arrowizeRoute("A -> B -> C")).toBe("A → B → C");
    expect(arrowizeRoute("A->B")).toBe("A → B");
  });

  it("returns an empty string for null or undefined", () => {
    expect(arrowizeRoute(null)).toBe("");
    expect(arrowizeRoute(undefined)).toBe("");
  });
});
