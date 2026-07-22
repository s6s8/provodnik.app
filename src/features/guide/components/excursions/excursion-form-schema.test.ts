import { describe, expect, it } from "vitest";

import { excursionFormSchema } from "./excursion-form-schema";

const valid = {
  title: "Прогулка по центру",
  description: "",
  duration: "",
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
