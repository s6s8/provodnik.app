import { describe, expect, it } from "vitest";

import { arrowizeRoute } from "./utils";

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
