import { describe, expect, it } from "vitest";

import { travelerRequestSchema } from "@/data/traveler-request/schema";

describe("travelerRequestSchema", () => {
  it("sanitizes polluted destination labels from traveler form input", () => {
    const parsed = travelerRequestSchema.parse({
      mode: "private",
      interests: ["history_culture"],
      startTime: "10:00",
      endTime: "18:00",
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
      startTime: "10:00",
      endTime: "18:00",
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

  it("rejects garbage destination text with a clear Russian message", () => {
    const result = travelerRequestSchema.safeParse({
      mode: "private",
      interests: ["history_culture"],
      startTime: "10:00",
      endTime: "18:00",
      destination: "!!!###garbage_XYZ_ноль123",
      startDate: "2026-05-10",
      dateFlexibility: "exact",
      groupSize: 2,
      allowGuideSuggestionsOutsideConstraints: true,
      budgetPerPersonRub: 1500,
      notes: "",
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("Expected garbage destination to fail");
    expect(result.error.flatten().fieldErrors.destination).toContain(
      "Укажите название места буквами, например «Казань» или «Шанхай».",
    );
  });

  it("rejects an overlong destination past 80 characters", () => {
    const result = travelerRequestSchema.safeParse({
      mode: "private",
      interests: ["history_culture"],
      startTime: "10:00",
      endTime: "18:00",
      destination: "Ё".repeat(81),
      startDate: "2026-05-10",
      dateFlexibility: "exact",
      groupSize: 2,
      allowGuideSuggestionsOutsideConstraints: true,
      budgetPerPersonRub: 1500,
      notes: "",
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("Expected overlong destination to fail");
    expect(result.error.flatten().fieldErrors.destination).toContain("Не больше 80 символов.");
  });

  it("accepts unlisted but real non-local destinations (Shanghai, St. Petersburg)", () => {
    for (const destination of ["Шанхай", "Санкт-Петербург", "Ростов-на-Дону"]) {
      const parsed = travelerRequestSchema.parse({
        mode: "private",
        interests: ["history_culture"],
        startTime: "10:00",
        endTime: "18:00",
        destination,
        startDate: "2026-05-10",
        dateFlexibility: "exact",
        groupSize: 2,
        allowGuideSuggestionsOutsideConstraints: true,
        budgetPerPersonRub: 1500,
        notes: "",
      });
      expect(parsed.destination).toBe(destination);
    }
  });

  it("shows a Russian message (not raw NaN) for non-numeric budget input", () => {
    const result = travelerRequestSchema.safeParse({
      mode: "private",
      interests: ["history_culture"],
      startTime: "10:00",
      endTime: "18:00",
      destination: "Москва",
      startDate: "2026-05-10",
      dateFlexibility: "exact",
      groupSize: 2,
      allowGuideSuggestionsOutsideConstraints: true,
      // Number("abc") from valueAsNumber / server Number(...) coercion.
      budgetPerPersonRub: Number.NaN,
      notes: "",
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("Expected NaN budget to fail");
    const messages = result.error.flatten().fieldErrors.budgetPerPersonRub ?? [];
    expect(messages).toContain("Укажите бюджет числом, например 5000.");
    expect(messages.join(" ")).not.toMatch(/NaN/);
  });

  it("defaults date flexibility and accepts an unset budget", () => {
    const parsed = travelerRequestSchema.parse({
      mode: "private",
      interests: ["history_culture"],
      startTime: "10:00",
      endTime: "18:00",
      destination: "Москва",
      startDate: "2026-05-10",
      groupSize: 2,
      allowGuideSuggestionsOutsideConstraints: true,
      notes: "",
    });

    expect(parsed.dateFlexibility).toBe("exact");
    expect(parsed.budgetPerPersonRub).toBeUndefined();
  });

  it("accepts assembly requests without groupMax (form does not collect it)", () => {
    const result = travelerRequestSchema.safeParse({
      mode: "assembly",
      interests: ["history_culture"],
      startTime: "10:00",
      endTime: "18:00",
      destination: "Москва",
      startDate: "2026-05-10",
      dateFlexibility: "exact",
      groupSizeCurrent: 2,
      allowGuideSuggestionsOutsideConstraints: true,
      notes: "",
    });

    expect(result.success).toBe(true);
  });

  it("accepts an endDate on or after startDate", () => {
    const result = travelerRequestSchema.safeParse({
      mode: "private",
      interests: ["history_culture"],
      startTime: "10:00",
      endTime: "18:00",
      destination: "Москва",
      startDate: "2026-08-01",
      endDate: "2026-08-07",
      dateFlexibility: "exact",
      groupSize: 2,
      allowGuideSuggestionsOutsideConstraints: true,
      notes: "",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an endDate earlier than startDate", () => {
    const result = travelerRequestSchema.safeParse({
      mode: "private",
      interests: ["history_culture"],
      startTime: "10:00",
      endTime: "18:00",
      destination: "Москва",
      startDate: "2026-08-07",
      endDate: "2026-08-01",
      dateFlexibility: "exact",
      groupSize: 2,
      allowGuideSuggestionsOutsideConstraints: true,
      notes: "",
    });

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error("Expected schema validation to fail");
    }

    expect(result.error.flatten().fieldErrors.endDate).toContain(
      "Дата окончания не может быть раньше даты начала.",
    );
  });

  it("accepts few_days requests without fixed times", () => {
    const result = travelerRequestSchema.safeParse({
      mode: "private",
      interests: ["history_culture"],
      destination: "Москва",
      startDate: "2026-08-01",
      dateFlexibility: "few_days",
      groupSize: 2,
      allowGuideSuggestionsOutsideConstraints: true,
      notes: "",
    });

    expect(result.success).toBe(true);
  });

  it("still requires times for exact-date requests", () => {
    const result = travelerRequestSchema.safeParse({
      mode: "private",
      interests: ["history_culture"],
      destination: "Москва",
      startDate: "2026-08-01",
      dateFlexibility: "exact",
      groupSize: 2,
      allowGuideSuggestionsOutsideConstraints: true,
      notes: "",
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error("Expected exact-date request without times to fail");
    expect(result.error.flatten().fieldErrors.startTime).toContain(
      "Укажите время начала (ЧЧ:ММ).",
    );
  });
});
