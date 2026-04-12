import type { ListingRow } from "@/lib/supabase/types";

export type ListingExpType = NonNullable<ListingRow["exp_type"]>;

export type SectionKey =
  | "basics"
  | "photos"
  | "schedule"
  | "tariffs"
  | "idea_route_theme"
  | "audience_facts"
  | "org_details"
  | "included_excluded"
  | "difficulty"
  | "accommodation"
  | "itinerary"
  | "meals_grid"
  | "departures"
  | "pickup_dropoff"
  | "vehicle_baggage"
  | "meeting_point";

export interface EditorSection {
  key: SectionKey;
  label: string;
  /** True if this section must be complete before publishing */
  required: boolean;
}

export const ALL_SECTIONS: Record<SectionKey, EditorSection> = {
  basics: { key: "basics", label: "Основное", required: true },
  photos: { key: "photos", label: "Фото", required: true },
  schedule: { key: "schedule", label: "Расписание", required: false },
  tariffs: { key: "tariffs", label: "Тарифы", required: true },
  idea_route_theme: {
    key: "idea_route_theme",
    label: "Идея / Маршрут / Тема",
    required: false,
  },
  audience_facts: {
    key: "audience_facts",
    label: "Аудитория и факты",
    required: false,
  },
  org_details: {
    key: "org_details",
    label: "Детали организации",
    required: false,
  },
  included_excluded: {
    key: "included_excluded",
    label: "Включено / не включено",
    required: false,
  },
  difficulty: { key: "difficulty", label: "Сложность", required: false },
  accommodation: {
    key: "accommodation",
    label: "Проживание",
    required: false,
  },
  itinerary: { key: "itinerary", label: "Программа", required: false },
  meals_grid: {
    key: "meals_grid",
    label: "Питание и транспорт",
    required: false,
  },
  departures: {
    key: "departures",
    label: "Даты отправления",
    required: false,
  },
  pickup_dropoff: {
    key: "pickup_dropoff",
    label: "Маршрут трансфера",
    required: false,
  },
  vehicle_baggage: {
    key: "vehicle_baggage",
    label: "Транспорт и багаж",
    required: false,
  },
  meeting_point: {
    key: "meeting_point",
    label: "Точка встречи",
    required: false,
  },
};

export const SECTIONS_BY_TYPE: Record<ListingExpType, SectionKey[]> = {
  excursion: [
    "basics",
    "photos",
    "schedule",
    "tariffs",
    "idea_route_theme",
    "audience_facts",
    "meeting_point",
  ],
  waterwalk: [
    "basics",
    "photos",
    "schedule",
    "tariffs",
    "idea_route_theme",
    "audience_facts",
    "meeting_point",
  ],
  masterclass: [
    "basics",
    "photos",
    "schedule",
    "tariffs",
    "org_details",
    "audience_facts",
    "meeting_point",
  ],
  photosession: [
    "basics",
    "photos",
    "schedule",
    "tariffs",
    "org_details",
    "meeting_point",
  ],
  quest: [
    "basics",
    "photos",
    "schedule",
    "tariffs",
    "idea_route_theme",
    "org_details",
    "audience_facts",
    "meeting_point",
  ],
  activity: [
    "basics",
    "photos",
    "schedule",
    "tariffs",
    "org_details",
    "audience_facts",
    "meeting_point",
  ],
  tour: [
    "basics",
    "photos",
    "itinerary",
    "meals_grid",
    "tariffs",
    "included_excluded",
    "difficulty",
    "accommodation",
    "departures",
    "meeting_point",
  ],
  transfer: [
    "basics",
    "photos",
    "tariffs",
    "pickup_dropoff",
    "vehicle_baggage",
    "meeting_point",
  ],
};
