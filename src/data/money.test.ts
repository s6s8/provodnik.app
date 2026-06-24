import { describe, expect, test, it } from "vitest";
import {
  rubToKopecks,
  kopecksToRub,
  formatRub,
  formatRubNumber,
  formatRubFromMinor,
} from "./money";

describe("RUB to kopecks round-trip", () => {
  test.each([0, 1, 50, 5000, 12345, 999999])("value %i round-trips", (rub) => {
    expect(kopecksToRub(rubToKopecks(rub))).toBe(rub);
  });
});

describe("RUB display formatting", () => {
  it("groups a rub number ru-RU style", () => {
    expect(formatRubNumber(3500)).toBe(new Intl.NumberFormat("ru-RU").format(3500));
  });

  it("formats a full rub display with the ₽ sign", () => {
    expect(formatRub(3500)).toBe(`${new Intl.NumberFormat("ru-RU").format(3500)} ₽`);
  });

  it("formats from kopecks, rounding to whole rubles", () => {
    expect(formatRubFromMinor(350000)).toBe(formatRub(3500));
    expect(formatRubFromMinor(349999)).toBe(formatRub(3500));
  });
});
