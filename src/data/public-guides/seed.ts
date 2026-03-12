import type { PublicGuideProfile } from "@/data/public-guides/types";

export const seededPublicGuides: readonly PublicGuideProfile[] = [
  {
    slug: "maria-rostov",
    displayName: "Maria K.",
    headline: "Local guide for Rostov-on-Don food walks and day trips.",
    homeBase: "Rostov-on-Don",
    yearsExperience: 6,
    regions: ["Rostov Oblast", "Krasnodar Krai", "Azov Sea coast"],
    languages: ["Russian", "English"],
    specialties: ["Food & markets", "History", "Family-friendly"],
    bio: "I design compact, high-signal itineraries: fewer stops, more context. Expect clear pacing, flexible plans for weather, and practical logistics.",
    trustMarkers: {
      emailVerified: true,
      phoneVerified: true,
      identityVerified: true,
      backgroundCheck: false,
      references: true,
    },
    reviewsSummary: {
      averageRating: 4.9,
      totalReviews: 18,
      lastReviewAt: "2026-02-04",
    },
  },
  {
    slug: "alexei-baikal",
    displayName: "Alexei S.",
    headline: "Winter Baikal routes, ice safety, and small-group logistics.",
    homeBase: "Irkutsk",
    yearsExperience: 9,
    regions: ["Irkutsk Oblast", "Lake Baikal", "Olkhon Island"],
    languages: ["Russian", "English", "German"],
    specialties: ["Nature", "Photography", "Off-season travel"],
    bio: "I’m strict about safety and honest about conditions. My focus is predictable transport, warm checkpoints, and realistic distances for the group.",
    trustMarkers: {
      emailVerified: true,
      phoneVerified: false,
      identityVerified: true,
      backgroundCheck: true,
      references: false,
    },
    reviewsSummary: {
      averageRating: 4.7,
      totalReviews: 9,
      lastReviewAt: "2025-12-19",
    },
  },
] as const;

export function getSeededPublicGuide(slug: string) {
  return seededPublicGuides.find((guide) => guide.slug === slug) ?? null;
}

