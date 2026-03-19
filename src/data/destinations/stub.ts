import type { DestinationRecord } from "@/data/destinations/types";

export const stubDestinations: DestinationRecord[] = [
  {
    id: "dst_spb",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    destination: {
      slug: "saint-petersburg",
      kind: "city",
      label: "Saint Petersburg",
      labelRu: "Санкт-Петербург",
      countryCode: "RU",
      region: "Northwestern Federal District",
      regionLabel: "Северо-Запад России",
      heroImageUrl:
        "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1600&h=1200&q=80",
    },
  },
  {
    id: "dst_rostov",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    destination: {
      slug: "rostov-on-don",
      kind: "city",
      label: "Rostov-on-Don",
      labelRu: "Ростов-на-Дону",
      countryCode: "RU",
      region: "Southern Federal District",
      regionLabel: "Юг России",
      heroImageUrl:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&h=1200&q=80",
    },
  },
  {
    id: "dst_altai",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    destination: {
      slug: "altai",
      kind: "region",
      label: "Altai",
      labelRu: "Алтай",
      countryCode: "RU",
      region: "Siberian Federal District",
      regionLabel: "Горный Алтай",
      heroImageUrl:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&h=1200&q=80",
    },
  },
  {
    id: "dst_baikal",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    destination: {
      slug: "lake-baikal",
      kind: "region",
      label: "Lake Baikal",
      labelRu: "Байкал",
      countryCode: "RU",
      region: "Siberian Federal District",
      regionLabel: "Байкал и Восточная Сибирь",
      heroImageUrl:
        "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1600&h=1200&q=80",
    },
  },
  {
    id: "dst_kazan",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    destination: {
      slug: "kazan",
      kind: "city",
      label: "Kazan",
      labelRu: "Казань",
      countryCode: "RU",
      region: "Volga Federal District",
      regionLabel: "Поволжье",
      heroImageUrl:
        "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&h=1200&q=80",
    },
  },
] as const;
