import type { PublicListing } from "@/data/public-listings/types";

export const seededPublicListings: readonly PublicListing[] = [
  {
    slug: "rostov-food-walk",
    title: "Гастропрогулка по Ростову: рынок, дворики и набережная",
    city: "Ростов-на-Дону",
    region: "Ростовская область",
    durationDays: 1,
    priceFromRub: 8500,
    groupSizeMax: 6,
    themes: ["Еда", "История", "С семьей"],
    highlights: [
      "Центральный рынок с понятным маршрутом дегустаций",
      "Прогулка по набережной с контекстом, а не набором фактов",
      "Есть запасной план на случай дождя",
    ],
    itinerary: [
      {
        title: "Знакомство и настройка маршрута",
        description:
          "Коротко обсуждаем темп, предпочтения и что лучше пропустить, если рынок слишком шумный.",
        durationHours: 0.5,
      },
      {
        title: "Рынок и дегустации",
        description:
          "Локальные продукты, сильные точки и практичные советы, что стоит попробовать и купить.",
        durationHours: 2,
      },
      {
        title: "Старые улицы и набережная",
        description:
          "Компактный городской круг с остановками для фото и удобным завершением рядом с транспортом.",
        durationHours: 1.5,
      },
    ],
    inclusions: ["Работа гида", "Чай и перекус"],
    guideSlug: "maria-rostov",
  },
  {
    slug: "baikal-ice-safety-day",
    title: "Зимний Байкал: ледовые маршруты и безопасный темп",
    city: "Иркутск",
    region: "Иркутская область",
    durationDays: 1,
    priceFromRub: 14500,
    groupSizeMax: 5,
    themes: ["Природа", "Фотография", "Несезон"],
    highlights: [
      "Реалистичная дистанция без героических обещаний",
      "Точки контроля льда и паузы на обогрев",
      "Остановки под фото с учетом света и погоды",
    ],
    itinerary: [
      {
        title: "Брифинг по условиям",
        description:
          "Выбираем маршрут по ветру, видимости и текущему состоянию поверхности.",
        durationHours: 0.75,
      },
      {
        title: "Ледовая прогулка и видовые точки",
        description:
          "Короткие отрезки, понятный темп и заранее оговоренные места сбора.",
        durationHours: 3,
      },
      {
        title: "Теплая остановка и завершение",
        description:
          "Чай, короткий отдых и предсказуемый финал, чтобы спокойно вернуться в город.",
        durationHours: 1,
      },
    ],
    inclusions: ["Работа гида", "Чай и перекус", "Снаряжение"],
    guideSlug: "alexei-baikal",
  },
  {
    slug: "rostov-day-trip-azov",
    title: "Азов за день: крепость, море и обед с местным колоритом",
    city: "Азов",
    region: "Ростовская область",
    durationDays: 1,
    priceFromRub: 12500,
    groupSizeMax: 6,
    themes: ["История", "С семьей", "Фотография"],
    highlights: [
      "Крепость и музей без перегруза датами",
      "Видовые точки у воды и короткие прогулки по желанию",
      "Гибкий выбор обеда, в том числе для гостей с ограничениями",
    ],
    itinerary: [
      {
        title: "Выезд и запас по времени",
        description:
          "Стартуем так, чтобы избежать очередей и иметь запасной вариант на выходные дни.",
        durationHours: 1,
      },
      {
        title: "Маршрут по крепости",
        description:
          "Небольшой круг с историей места, фотоостановками и понятными паузами на отдых.",
        durationHours: 2,
      },
      {
        title: "Обед и береговая линия",
        description:
          "Обед в локальном месте, затем короткий участок у воды с поправкой на сезон и ветер.",
        durationHours: 2,
      },
    ],
    inclusions: ["Работа гида", "Локальный транспорт"],
    guideSlug: "maria-rostov",
  },
] as const;

export function getSeededPublicListing(slug: string) {
  return seededPublicListings.find((listing) => listing.slug === slug) ?? null;
}
