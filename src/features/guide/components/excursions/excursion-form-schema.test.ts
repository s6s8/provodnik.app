import { describe, expect, it } from "vitest";

import { excursionFormSchema } from "./excursion-form-schema";

const valid = {
  title: "Прогулка по центру",
  description: "",
  duration: "",
  priceScope: "per_group" as const,
  priceRub: "5000",
  meetingPoint: "",
  maxParticipants: "8",
  photoUrls: ["https://cdn/x.jpg"],
  region: "Казань",
  category: "history_culture",
};

describe("excursionFormSchema — moderation lifecycle", () => {
  it("accepts a submit-for-review payload with a photo", () => {
    expect(excursionFormSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a guide setting status directly to published", () => {
    const result = excursionFormSchema.safeParse({ ...valid, status: "published" });
    expect(result.success).toBe(false);
  });

  it("rejects a guide setting status directly to draft", () => {
    const result = excursionFormSchema.safeParse({ ...valid, status: "draft", photoUrls: [] });
    expect(result.success).toBe(false);
  });

  it("requires a photo before submitting for review", () => {
    const result = excursionFormSchema.safeParse({ ...valid, photoUrls: [] });
    expect(result.success).toBe(false);
  });
});

describe("excursionFormSchema — price scope", () => {
  it("accepts per-group pricing", () => {
    const result = excursionFormSchema.safeParse({ ...valid, priceScope: "per_group" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priceScope).toBe("per_group");
    }
  });

  it("accepts per-person pricing", () => {
    const result = excursionFormSchema.safeParse({ ...valid, priceScope: "per_person" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priceScope).toBe("per_person");
    }
  });

  it("rejects an unknown price scope", () => {
    const result = excursionFormSchema.safeParse({ ...valid, priceScope: "per_trip" });
    expect(result.success).toBe(false);
  });
});
