import { describe, expect, it } from "vitest";

import { arrowizeRoute, pluralize, pluralizePeopleGenitive } from "./utils";

describe("pluralize", () => {
  const people = (n: number) => pluralize(n, "человек", "человека", "человек");

  // The whole app counts people through this one call. 11 must follow 5 (not 1)
  // and 21 must follow 1 — that is where hand-rolled declension always broke.
  it.each([
    [1, "человек"],
    [2, "человека"],
    [5, "человек"],
    [11, "человек"],
    [21, "человек"],
    [111, "человек"],
    [22, "человека"],
    [112, "человек"],
  ])("declines %i people as «%s»", (n, expected) => {
    expect(people(n)).toBe(expected);
  });

  it("declines other count-words on the same boundaries", () => {
    const seats = (n: number) => pluralize(n, "место", "места", "мест");
    expect([1, 2, 5, 11, 21, 111].map(seats)).toEqual([
      "место",
      "места",
      "мест",
      "мест",
      "место",
      "мест",
    ]);
  });
});

describe("pluralizePeopleGenitive", () => {
  it.each([
    [1, "человека"],
    [2, "человек"],
    [5, "человек"],
    [11, "человек"],
    [21, "человека"],
    [111, "человек"],
    [121, "человека"],
  ])("returns the genitive form used after %i", (n, expected) => {
    expect(pluralizePeopleGenitive(n)).toBe(expected);
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
