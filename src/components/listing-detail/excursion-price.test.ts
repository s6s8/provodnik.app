import { describe, expect, it } from "vitest";

import { formatExcursionPriceFrom } from "./excursion-price";

const base = (minor: number) =>
  `от ${new Intl.NumberFormat("ru-RU").format(minor / 100)} ₽`;

describe("formatExcursionPriceFrom", () => {
  it("appends «за одного» for group listings", () => {
    expect(formatExcursionPriceFrom(500_000, "group")).toBe(`${base(500_000)} за одного`);
  });

  it("appends «за одного» for combo listings", () => {
    expect(formatExcursionPriceFrom(500_000, "combo")).toBe(`${base(500_000)} за одного`);
  });

  it("appends «за группу до N человек» for private listings with a group max", () => {
    expect(formatExcursionPriceFrom(1_200_000, "private", 5)).toBe(
      `${base(1_200_000)} за группу до 5 человек`,
    );
  });

  it("appends bare «за группу» for private listings without a group max", () => {
    expect(formatExcursionPriceFrom(1_200_000, "private")).toBe(`${base(1_200_000)} за группу`);
  });

  // The cap is a real number from listings.max_group_size, so it hits the Russian
  // genitive forms: «до 1 человека» / «до 21 человека», not «до 1 человек».
  it.each([
    [1, "до 1 человека"],
    [2, "до 2 человек"],
    [5, "до 5 человек"],
    [11, "до 11 человек"],
    [21, "до 21 человека"],
  ])("declines the group cap correctly for %i", (cap, expected) => {
    expect(formatExcursionPriceFrom(1_200_000, "private", cap)).toBe(
      `${base(1_200_000)} за группу ${expected}`,
    );
  });

  it("ignores the group max for per-person (group) listings", () => {
    expect(formatExcursionPriceFrom(500_000, "group", 8)).toBe(`${base(500_000)} за одного`);
  });

  it("omits the suffix when format is null", () => {
    expect(formatExcursionPriceFrom(500_000, null)).toBe(base(500_000));
  });

  it("omits the suffix for an unknown (non-enum) format string", () => {
    expect(formatExcursionPriceFrom(500_000, "history_culture", 6)).toBe(base(500_000));
  });

  it("uses an explicit per_group price scope regardless of the format badge (item 2)", () => {
    // A ready tour keeps its "group" tour-type badge but prices «за группу».
    expect(formatExcursionPriceFrom(500_000, "group", 8, "per_group")).toBe(
      `${base(500_000)} за группу до 8 человек`,
    );
  });

  it("uses an explicit per_person price scope even when format is private", () => {
    expect(formatExcursionPriceFrom(500_000, "private", 8, "per_person")).toBe(
      `${base(500_000)} за одного`,
    );
  });
});
