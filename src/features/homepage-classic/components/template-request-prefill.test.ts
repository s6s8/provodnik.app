import { describe, expect, it } from "vitest";

import type { PublicGuideTemplateDetail } from "@/lib/supabase/guide-template-listings";

import { buildTemplateRequestPrefill } from "./template-request-prefill";

const DETAIL: PublicGuideTemplateDetail = {
  id: "tpl-1",
  title: "Исторический центр",
  description: "Прогулка по старому городу.",
  photoUrl: "/photo.jpg",
  priceFromKopecks: 400_000,
  priceScope: "per_group",
  durationText: "3 часа",
  meetingPoint: "Казань, пл. Тукая",
  maxParticipants: 4,
  region: "Казань",
  category: "history_culture",
  guide: { slug: "guide-1", displayName: "Гид" },
};

describe("buildTemplateRequestPrefill", () => {
  it("maps location, description, and per-person budget from a ready excursion", () => {
    expect(buildTemplateRequestPrefill(DETAIL)).toEqual({
      destination: "Казань",
      notes: "Прогулка по старому городу.",
      budgetPerPersonRub: 1000,
    });
  });

  it("keeps per-person template prices as-is", () => {
    expect(
      buildTemplateRequestPrefill({
        ...DETAIL,
        priceFromKopecks: 50_000,
        priceScope: "per_person",
      }),
    ).toMatchObject({
      budgetPerPersonRub: 1000,
    });
  });
});
