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

  it("ignores the group max for per-person (group) listings", () => {
    expect(formatExcursionPriceFrom(500_000, "group", 8)).toBe(`${base(500_000)} за одного`);
  });

  it("omits the suffix when format is null", () => {
    expect(formatExcursionPriceFrom(500_000, null)).toBe(base(500_000));
  });

  it("omits the suffix for an unknown (non-enum) format string", () => {
    expect(formatExcursionPriceFrom(500_000, "history_culture", 6)).toBe(base(500_000));
  });
});
