import { describe, expect, it } from "vitest";

import {
  COMPLETE_MESSAGE,
  EMPTY_FIELDS,
  computeMissingRequired,
  isComplete,
  mergeFields,
  nextQuestion,
  sanitizeExtraction,
  type ExtractedFields,
} from "./extraction";

const FULL: ExtractedFields = {
  destination: "Москва",
  startDate: "2026-06-03",
  startTime: "10:00",
  endTime: null,
  groupSize: 2,
  budgetPerPersonRub: 5000,
  interests: ["history", "food"],
  requestedLanguages: ["Русский"],
  notes: null,
};

describe("sanitizeExtraction", () => {
  it("keeps valid values", () => {
    const out = sanitizeExtraction({
      destination: "Москва",
      startDate: "2026-06-03",
      startTime: "9:30",
      groupSize: 2,
      budgetPerPersonRub: 5000,
      interests: ["history", "food"],
      requestedLanguages: ["Русский"],
    });
    expect(out.destination).toBe("Москва");
    expect(out.startDate).toBe("2026-06-03");
    expect(out.startTime).toBe("09:30");
    expect(out.groupSize).toBe(2);
    expect(out.budgetPerPersonRub).toBe(5000);
    expect(out.interests).toEqual(["history", "food"]);
  });

  it("drops unknown theme slugs (no invented categories)", () => {
    const out = sanitizeExtraction({ interests: ["history", "nightlife", "shopping"] });
    expect(out.interests).toEqual(["history"]);
  });

  it("nulls out malformed date and non-positive numbers", () => {
    const out = sanitizeExtraction({
      startDate: "tomorrow",
      groupSize: 0,
      budgetPerPersonRub: -100,
    });
    expect(out.startDate).toBeNull();
    expect(out.groupSize).toBeNull();
    expect(out.budgetPerPersonRub).toBeNull();
  });

  it("treats missing/garbage input as empty fields, never throwing", () => {
    expect(sanitizeExtraction(null)).toEqual(EMPTY_FIELDS);
    expect(sanitizeExtraction("nonsense")).toEqual(EMPTY_FIELDS);
    expect(sanitizeExtraction({ destination: "   " })).toEqual(EMPTY_FIELDS);
  });

  it("deduplicates interests and languages", () => {
    const out = sanitizeExtraction({
      interests: ["food", "food"],
      requestedLanguages: ["Русский", "Русский"],
    });
    expect(out.interests).toEqual(["food"]);
    expect(out.requestedLanguages).toEqual(["Русский"]);
  });
});

describe("mergeFields", () => {
  it("incoming non-null wins, prior preserved otherwise", () => {
    const prior: ExtractedFields = { ...EMPTY_FIELDS, destination: "Москва", groupSize: 2 };
    const incoming: ExtractedFields = { ...EMPTY_FIELDS, startDate: "2026-06-03" };
    const merged = mergeFields(prior, incoming);
    expect(merged.destination).toBe("Москва");
    expect(merged.groupSize).toBe(2);
    expect(merged.startDate).toBe("2026-06-03");
  });

  it("never loses a prior value when incoming is empty", () => {
    const merged = mergeFields(FULL, EMPTY_FIELDS);
    expect(merged).toEqual(FULL);
  });

  it("incoming arrays replace prior when non-empty", () => {
    const prior: ExtractedFields = { ...EMPTY_FIELDS, interests: ["history"] };
    const incoming: ExtractedFields = { ...EMPTY_FIELDS, interests: ["food", "art"] };
    expect(mergeFields(prior, incoming).interests).toEqual(["food", "art"]);
  });
});

describe("computeMissingRequired / isComplete", () => {
  it("lists every required field for empty state", () => {
    expect(computeMissingRequired(EMPTY_FIELDS)).toEqual([
      "destination",
      "startDate",
      "groupSize",
      "budgetPerPersonRub",
      "interests",
    ]);
    expect(isComplete(EMPTY_FIELDS)).toBe(false);
  });

  it("is complete when all five required are present", () => {
    expect(computeMissingRequired(FULL)).toEqual([]);
    expect(isComplete(FULL)).toBe(true);
  });

  it("treats empty interests array as missing", () => {
    expect(computeMissingRequired({ ...FULL, interests: [] })).toEqual(["interests"]);
  });
});

describe("nextQuestion", () => {
  it("asks for the first missing field in priority order", () => {
    expect(nextQuestion(["startDate", "interests"])).toMatch(/дат/i);
  });

  it("returns null when nothing is missing", () => {
    expect(nextQuestion([])).toBeNull();
  });

  it("COMPLETE_MESSAGE is a non-empty confirmation", () => {
    expect(COMPLETE_MESSAGE.length).toBeGreaterThan(0);
  });
});
