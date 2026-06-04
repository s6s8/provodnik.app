import { describe, expect, it } from "vitest";

import { travelerRequestSchema } from "@/data/traveler-request/schema";

describe("travelerRequestSchema", () => {
  it("sanitizes polluted destination labels from traveler form input", () => {
    const parsed = travelerRequestSchema.parse({
      mode: "private",
      interests: ["history_culture"],
      destination: "МоскваМосква placeholder=Москва autocomplete=list",
      startDate: "2026-05-10",
      dateFlexibility: "exact",
      groupSize: 2,
      allowGuideSuggestionsOutsideConstraints: true,
      budgetPerPersonRub: 1500,
      notes: "",
    });

    expect(parsed.destination).toBe("Москва");
  });

  it("keeps empty destinations invalid after sanitizing traveler form input", () => {
    const result = travelerRequestSchema.safeParse({
      mode: "private",
      interests: ["history_culture"],
      destination: "placeholder=Москва autocomplete=list",
      startDate: "2026-05-10",
      dateFlexibility: "exact",
      groupSize: 2,
      allowGuideSuggestionsOutsideConstraints: true,
      budgetPerPersonRub: 1500,
      notes: "",
    });

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error("Expected schema validation to fail");
    }

    expect(result.error.flatten().fieldErrors.destination).toContain(
      "Укажите город или направление.",
    );
  });

  it("defaults date flexibility and accepts an unset budget", () => {
    const parsed = travelerRequestSchema.parse({
      mode: "private",
      interests: ["history_culture"],
      destination: "Москва",
      startDate: "2026-05-10",
      groupSize: 2,
      allowGuideSuggestionsOutsideConstraints: true,
      notes: "",
    });

    expect(parsed.dateFlexibility).toBe("exact");
    expect(parsed.budgetPerPersonRub).toBeUndefined();
  });

  it("requires groupMax, not current size, for assembly requests", () => {
    const result = travelerRequestSchema.safeParse({
      mode: "assembly",
      interests: ["history_culture"],
      destination: "Москва",
      startDate: "2026-05-10",
      dateFlexibility: "exact",
      groupSizeCurrent: 2,
      allowGuideSuggestionsOutsideConstraints: true,
      notes: "",
    });

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error("Expected schema validation to fail");
    }

    expect(result.error.flatten().fieldErrors.groupMax).toContain(
      "Укажите максимальный размер группы.",
    );
  });
});
