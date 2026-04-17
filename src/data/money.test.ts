import { describe, expect, test } from "vitest";
import { rubToKopecks, kopecksToRub } from "./money";

describe("RUB to kopecks round-trip", () => {
  test.each([0, 1, 50, 5000, 12345, 999999])("value %i round-trips", (rub) => {
    expect(kopecksToRub(rubToKopecks(rub))).toBe(rub);
  });
});
