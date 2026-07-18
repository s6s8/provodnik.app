import { describe, expect, it } from "vitest";

import {
  isSupportedDestinationLabel,
  sanitizeTravelerRequestDestinationLabel,
} from "@/lib/traveler-request-destination";

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

describe("isSupportedDestinationLabel", () => {
  it("accepts real place names, including unlisted and multi-word ones", () => {
    for (const name of [
      "Москва",
      "Шанхай",
      "Казань",
      "Санкт-Петербург",
      "Ростов-на-Дону",
      "Нижний Новгород",
      "Астраханский край",
      "Марс-Сити",
      "Paris",
    ]) {
      expect(isSupportedDestinationLabel(name), name).toBe(true);
    }
  });

  it("rejects symbol/number garbage", () => {
    for (const junk of [
      "!!!###garbage_XYZ_ноль123",
      "12345",
      "<script>alert(1)</script>",
      "___",
      "a", // too short
      "ЁЁЁЁЁЁ", // one distinct letter repeated
    ]) {
      expect(isSupportedDestinationLabel(junk), junk).toBe(false);
    }
  });

  it("rejects overlong input past the 80-char bound", () => {
    expect(isSupportedDestinationLabel("Ё".repeat(81))).toBe(false);
  });
});
