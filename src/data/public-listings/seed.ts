import type { PublicListing } from "@/data/public-listings/types";

export const seededPublicListings: readonly PublicListing[] = [
  {
    slug: "rostov-food-walk",
    title: "Гастропрогулка по Ростову: рынок, дворики и набережная",
    city: "Ростов-на-Дону",
    region: "Ростовская область",
    coverImageUrl:
      "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?auto=format&fit=crop&w=1600&h=1200&q=80",
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
    coverImageUrl:
      "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?auto=format&fit=crop&w=1600&h=1200&q=80",
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
    coverImageUrl:
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1600&h=1200&q=80",
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
  {
    slug: "spb-white-nights-editorial",
    title: "Белые ночи: тихая Нева, дворы и светлый Петербург без спешки",
    city: "Санкт-Петербург",
    region: "Санкт-Петербург",
    coverImageUrl:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1600&h=1200&q=80",
    durationDays: 1,
    priceFromRub: 14200,
    groupSizeMax: 6,
    themes: ["История", "Фотография", "С семьей"],
    highlights: [
      "Маршрут выстроен вокруг света, а не вокруг очередей",
      "Дворы и набережные с паузами на видовые точки",
      "Спокойный темп, удобный для первой встречи с городом",
    ],
    itinerary: [
      {
        title: "Невский и первые акценты",
        description:
          "Начинаем с понятного ритма прогулки и быстро уходим с перегруженных участков к более тихим адресам.",
        durationHours: 1,
      },
      {
        title: "Дворы, вода и свет",
        description:
          "Идем через дворы-колодцы и небольшие набережные, обсуждая город через детали среды, а не через длинный список дат.",
        durationHours: 2,
      },
      {
        title: "Финал у Невы",
        description:
          "Завершаем маршрут в точке, где удобно задержаться на фото или спокойно уйти на ужин без лишней логистики.",
        durationHours: 1,
      },
    ],
    inclusions: ["Работа гида", "Чай и перекус"],
    guideSlug: "anna-petersburg",
  },
  {
    slug: "kazan-evening-taste-walk",
    title: "Казань вечером: чайные истории, старые улицы и татарский вкус",
    city: "Казань",
    region: "Республика Татарстан",
    coverImageUrl:
      "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1600&h=1200&q=80",
    durationDays: 1,
    priceFromRub: 9800,
    groupSizeMax: 8,
    themes: ["Еда", "История", "С семьей"],
    highlights: [
      "Вечерний маршрут без перегруженного центра",
      "Чай, выпечка и разговор о городе через гастрономию",
      "Короткие переходы и комфортный темп для компании",
    ],
    itinerary: [
      {
        title: "Старый город и вводный круг",
        description:
          "Собираем контекст прогулки и выбираем темп так, чтобы маршрут подошел и семьям, и небольшой взрослой компании.",
        durationHours: 1,
      },
      {
        title: "Чайная пауза и локальные вкусы",
        description:
          "Заходим в проверенное место, где легко обсудить татарскую кухню через понятные примеры и без туристической постановочности.",
        durationHours: 1.5,
      },
      {
        title: "Подсвеченные улицы и финал",
        description:
          "Доходим до красивых вечерних точек, откуда удобно продолжить ужин или вернуться в отель.",
        durationHours: 1,
      },
    ],
    inclusions: ["Работа гида", "Чай и перекус"],
    guideSlug: "timur-kazan",
  },
  {
    slug: "suzdal-morning-bells",
    title: "Суздаль с первого света: монастыри, луга и утренний воздух над рекой",
    city: "Суздаль",
    region: "Владимирская область",
    coverImageUrl:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&h=1200&q=80",
    durationDays: 1,
    priceFromRub: 8900,
    groupSizeMax: 5,
    themes: ["История", "Фотография", "С семьей"],
    highlights: [
      "Ранний старт ради света и тишины",
      "Видовые точки без длинных переездов",
      "Маршрут хорошо подходит тем, кто не любит спешку",
    ],
    itinerary: [
      {
        title: "Тихое утро в центре",
        description:
          "Выходим до дневного потока и видим старый город в более спокойном и цельном состоянии.",
        durationHours: 1,
      },
      {
        title: "Монастыри и берег",
        description:
          "Идем короткими переходами между ключевыми точками, оставляя время на паузы и фотографии.",
        durationHours: 2,
      },
      {
        title: "Локальный финал",
        description:
          "Завершаем прогулку ремесленной лавкой или медовухой - в зависимости от настроения группы.",
        durationHours: 1,
      },
    ],
    inclusions: ["Работа гида"],
    guideSlug: "elena-suzdal",
  },
  {
    slug: "kaliningrad-dunes-courtyards",
    title: "Калининград и Куршская коса: виллы, ветер и дюны одним уверенным днем",
    city: "Калининград",
    region: "Калининградская область",
    coverImageUrl:
      "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1600&h=1200&q=80",
    durationDays: 2,
    priceFromRub: 18600,
    groupSizeMax: 6,
    themes: ["Природа", "История", "Фотография"],
    highlights: [
      "Сочетание городских вилл и береговой линии без хаотичной логистики",
      "Продуманные остановки там, где пейзаж действительно работает",
      "Есть запасные сценарии на случай сильного ветра",
    ],
    itinerary: [
      {
        title: "Калининградские кварталы",
        description:
          "Начинаем с архитектурного контекста и собираем ощущение города через улицы, виллы и воду.",
        durationHours: 2,
      },
      {
        title: "Выезд к морю",
        description:
          "Перестраиваемся в более свободный темп и выезжаем на побережье с понятными паузами по пути.",
        durationHours: 2.5,
      },
      {
        title: "Дюны и вечерний берег",
        description:
          "Финал строится вокруг света и погоды, чтобы получить сильную картинку, а не галочку по точкам.",
        durationHours: 2,
      },
    ],
    inclusions: ["Работа гида", "Локальный транспорт"],
    guideSlug: "igor-kaliningrad",
  },
  {
    slug: "murmansk-northern-coast",
    title: "Мурманск и северный берег: порт, тундра и мягкий свет Баренцева моря",
    city: "Мурманск",
    region: "Мурманская область",
    coverImageUrl:
      "https://images.unsplash.com/photo-1455156218388-5e61287f7b4c?auto=format&fit=crop&w=1600&h=1200&q=80",
    durationDays: 2,
    priceFromRub: 21400,
    groupSizeMax: 4,
    themes: ["Природа", "Фотография", "Несезон"],
    highlights: [
      "Северный маршрут без обещаний того, что зависит от погоды",
      "Порт и берег в одном цельном ритме дня",
      "Маленькая группа и аккуратная логистика на длинных отрезках",
    ],
    itinerary: [
      {
        title: "Портовый контекст",
        description:
          "Начинаем с Мурманска и собираем северную историю через порт, масштаб и городскую повседневность.",
        durationHours: 1.5,
      },
      {
        title: "Дорога к берегу",
        description:
          "Следим за погодой, светом и состоянием дороги, чтобы сохранить маршрут красивым и реалистичным.",
        durationHours: 3,
      },
      {
        title: "Баренцево море",
        description:
          "На месте оставляем время на наблюдение, фото и паузу, а не только на обязательную отметку о прибытии.",
        durationHours: 2,
      },
    ],
    inclusions: ["Работа гида", "Локальный транспорт", "Чай и перекус"],
    guideSlug: "natalia-murmansk",
  },
] as const;

export function getSeededPublicListing(slug: string) {
  return seededPublicListings.find((listing) => listing.slug === slug) ?? null;
}
