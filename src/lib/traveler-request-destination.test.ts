import { describe, expect, it } from "vitest";

import { sanitizeTravelerRequestDestinationLabel } from "@/lib/traveler-request-destination";

describe("sanitizeTravelerRequestDestinationLabel", () => {
  it("removes leaked attribute fragments from destination labels", () => {
    const label = sanitizeTravelerRequestDestinationLabel(
      " Москва, Санкт-Петербург… placeholder=Москва, Санкт-Петербург… autocomplete=list ",
    );

    expect(label).toBe("Москва, Санкт-Петербург…");
    expect(label).not.toMatch(/placeholder|autocomplete/i);
  });

  it("collapses exact duplicated Cyrillic and Latin city words", () => {
    expect(sanitizeTravelerRequestDestinationLabel("МоскваМосква")).toBe("Москва");
    expect(sanitizeTravelerRequestDestinationLabel("ParisParis")).toBe("Paris");
  });

  it("normalizes repeated spaces and commas", () => {
    expect(sanitizeTravelerRequestDestinationLabel("  Москва,,   Санкт-Петербург  ")).toBe(
      "Москва, Санкт-Петербург",
    );
  });

  it("falls back when the label is empty", () => {
    expect(sanitizeTravelerRequestDestinationLabel(" placeholder=Москва")).toBe("Маршрут");
  });
});
