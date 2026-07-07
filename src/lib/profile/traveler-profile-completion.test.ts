import { describe, expect, it } from "vitest";

import {
  getTravelerProfileSection2Checklist,
  hasTravelerProfileName,
} from "./traveler-profile-completion";

describe("hasTravelerProfileName", () => {
  it("returns false for null, empty, and whitespace-only names", () => {
    expect(hasTravelerProfileName(null)).toBe(false);
    expect(hasTravelerProfileName("")).toBe(false);
    expect(hasTravelerProfileName("   ")).toBe(false);
  });

  it("returns true when a non-empty name is stored", () => {
    expect(hasTravelerProfileName("Анна")).toBe(true);
    expect(hasTravelerProfileName("  Мария  ")).toBe(true);
  });
});

describe("getTravelerProfileSection2Checklist", () => {
  it("marks the name item incomplete when full_name is absent", () => {
    const checklist = getTravelerProfileSection2Checklist({ full_name: null });

    expect(checklist.sectionTitle).toBe("Готовность профиля");
    expect(checklist.complete).toBe(false);
    expect(checklist.items).toEqual([
      { id: "name", label: "Имя путешественника", complete: false },
    ]);
  });

  it("marks the name item complete when full_name is set", () => {
    const checklist = getTravelerProfileSection2Checklist({ full_name: "Анна" });

    expect(checklist.complete).toBe(true);
    expect(checklist.items[0]?.complete).toBe(true);
  });
});
