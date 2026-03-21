import type { DestinationSummary } from "@/data/destinations/types";

/** Stub seed for destination discovery; replace with API or DB when ready. */
export const seededDestinations: readonly DestinationSummary[] = [
  {
    slug: "kazan",
    name: "Казань",
    region: "Республика Татарстан",
    imageUrl:
      "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1600&h=1200&q=80",
    description:
      "Смешение татарской и русской культур, вечерние прогулки и гастрономические маршруты.",
    listingCount: 12,
    openRequestCount: 2,
  },
  {
    slug: "altai",
    name: "Горно-Алтайск",
    region: "Республика Алтай",
    imageUrl:
      "https://images.unsplash.com/photo-1527489377706-5bf97e608852?auto=format&fit=crop&w=1600&h=1200&q=80",
    description:
      "Горные долины, спокойные треки и видовые точки для небольших групп.",
    listingCount: 8,
    openRequestCount: 1,
  },
  {
    slug: "lake-baikal",
    name: "Байкал",
    region: "Иркутская область",
    imageUrl:
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&h=1200&q=80",
    description:
      "Ледовые и межсезонные маршруты с акцентом на безопасность и реалистичный темп.",
    listingCount: 15,
    openRequestCount: 0,
  },
  {
    slug: "saint-petersburg",
    name: "Санкт-Петербург",
    region: "Ленинградская область",
    imageUrl:
      "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1600&h=1200&q=80",
    description:
      "Город для культурных и архитектурных прогулок с гибким, неспешным маршрутом.",
    listingCount: 24,
    openRequestCount: 1,
  },
  {
    slug: "moscow",
    name: "Москва",
    region: "Московская область",
    imageUrl:
      "https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=1600&h=1200&q=80",
    description:
      "Короткие городские программы с балансом классических точек и локальных районов.",
    listingCount: 30,
    openRequestCount: 3,
  },
];
