import type { PublicGuideProfile } from "@/data/public-guides/types";

export const seededPublicGuides: readonly PublicGuideProfile[] = [
  {
    slug: "maria-rostov",
    displayName: "Мария К.",
    headline: "Локальный гид по Ростову-на-Дону: гастромаршруты и поездки на день.",
    homeBase: "Ростов-на-Дону",
    yearsExperience: 6,
    regions: ["Ростовская область", "Краснодарский край", "Побережье Азовского моря"],
    languages: ["Русский", "Английский"],
    specialties: ["Еда и рынки", "История", "С детьми"],
    bio: "Я собираю компактные маршруты без перегруза: меньше точек, больше смысла. Обычно мои экскурсии выбирают за ясный темп, аккуратную логистику и запасной план на случай погоды.",
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
    displayName: "Алексей С.",
    headline: "Зимний Байкал, ледовая безопасность и маршруты для маленьких групп.",
    homeBase: "Иркутск",
    yearsExperience: 9,
    regions: ["Иркутская область", "Озеро Байкал", "Ольхон"],
    languages: ["Русский", "Английский", "Немецкий"],
    specialties: ["Природа", "Фотография", "Несезонные поездки"],
    bio: "Я строго отношусь к безопасности и честно объясняю, что реально возможно по погоде. Мой фокус - предсказуемый транспорт, теплые остановки и адекватный темп для группы.",
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
