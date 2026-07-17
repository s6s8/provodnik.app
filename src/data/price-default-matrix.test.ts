import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { formatRub, formatRubFromMinor, kopecksToRub, rubToKopecks } from "./money";

// Owner 609 price/default audit. The reported bug: an open-group request showed
// 5000 ₽/person. Root cause was SEED data (budget_minor 500000); the production
// form default was already 1000 ₽. This matrix pins the whole money chain so three
// regressions can never return silently:
//   (a) a 5000 ₽ default or seed sneaking back,
//   (b) a 100x minor-unit slip (RUB written where kopecks are expected, or vice versa),
//   (c) the default, the saved value, and the displayed value disagreeing.
//
// It binds to the REAL literals by reading source, not copies — change the default
// to 5000 or the seed to 500000 and this test goes red.

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

/** Production request-form default (RUB), from the actual constant. */
const formDefaultRub = Number(
  read("src/features/homepage-classic/components/use-request-form.ts").match(
    /budgetPerPersonRub:\s*(\d+)/,
  )?.[1],
);

/** Demo open-group budget the seed writes (kopecks / minor units). */
const seedBudgetMinor = Number(
  read("scripts/seed-qa-content.mjs").match(/budget_minor:\s*(\d+)/)?.[1],
);

/** Display exactly as the ru-RU formatter renders it (NBSP separator), from RUB. */
const display = (rub: number) => `${new Intl.NumberFormat("ru-RU").format(rub)} ₽`;

describe("price/default end-to-end matrix (owner 609)", () => {
  it("the production form default is 1000 ₽, not the reported 5000", () => {
    expect(formDefaultRub).toBe(1000);
    expect(formDefaultRub).not.toBe(5000);
  });

  it("the demo open-group seed is 1000 ₽ in minor units, not the reported 5000", () => {
    expect(seedBudgetMinor).toBe(100_000); // 1000 ₽ in kopecks
    expect(seedBudgetMinor).not.toBe(500_000); // the old 5000 ₽
    // The seed and the form default describe the same amount.
    expect(kopecksToRub(seedBudgetMinor)).toBe(formDefaultRub);
  });

  // The core matrix: every amount that flows through the product goes
  // RUB (form/offer input) → minor (create-request/offers write) →
  // RUB (mapRequestRow/mapListingRow read) → display. All four must agree.
  it.each<[string, number]>([
    ["form default", formDefaultRub],
    ["seed open-group", kopecksToRub(seedBudgetMinor)],
    ["real traveler amount", 3500],
    ["guide listing price", 6200],
    ["one-ruble edge", 1],
    ["large amount", 250_000],
  ])("%s: RUB → minor → RUB → display all agree", (_label, rub) => {
    const savedMinor = rubToKopecks(rub); // what create-request / offers persist
    expect(kopecksToRub(savedMinor)).toBe(rub); // what the mappers read back — no 100x slip
    // Both display helpers agree, whether given RUB or minor units.
    expect(formatRub(rub)).toBe(formatRubFromMinor(savedMinor));
    expect(formatRubFromMinor(savedMinor)).toBe(display(rub));
  });

  it("the default is stored and shown as «1 000 ₽» end to end", () => {
    const savedMinor = rubToKopecks(formDefaultRub);
    expect(savedMinor).toBe(100_000);
    expect(formatRubFromMinor(savedMinor)).toBe(display(1000));
  });
});
