import { describe, expect, it } from "vitest";

import { excursionFormSchema } from "./excursion-form-schema";

// Item 6: a guide may only ever produce draft or pending_review — never publish directly.
const valid = {
  title: "Прогулка по центру",
  description: "",
  duration: "",
  priceRub: "5000",
  status: "pending_review" as const,
  meetingPoint: "",
  maxParticipants: "8",
  photoUrls: ["https://cdn/x.jpg"],
  region: "Казань",
  category: "history_culture",
};

describe("excursionFormSchema — moderation lifecycle", () => {
  it("accepts a draft", () => {
    expect(excursionFormSchema.safeParse({ ...valid, status: "draft", photoUrls: [] }).success).toBe(true);
  });

  it("accepts a submit-for-review with a photo", () => {
    expect(excursionFormSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a guide setting status directly to published", () => {
    const result = excursionFormSchema.safeParse({ ...valid, status: "published" });
    expect(result.success).toBe(false);
  });

  it("requires a photo before submitting for review", () => {
    const result = excursionFormSchema.safeParse({ ...valid, photoUrls: [] });
    expect(result.success).toBe(false);
  });
});
