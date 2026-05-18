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

  it("appends «за группу» for private listings", () => {
    expect(formatExcursionPriceFrom(1_200_000, "private")).toBe(`${base(1_200_000)} за группу`);
  });

  it("omits the suffix when format is null", () => {
    expect(formatExcursionPriceFrom(500_000, null)).toBe(base(500_000));
  });
});
