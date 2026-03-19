import type { PublicListing } from "@/data/public-listings/types";

export const seededPublicListings: readonly PublicListing[] = [
  {
    slug: "rostov-food-walk",
    title: "Гастропрогулка по Ростову: рынок, дворики и набережная",
    city: "Ростов-на-Дону",
    region: "Ростовская область",
    regionLabel: "Юг России",
    destinationSlug: "rostov-on-don",
    coverImageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&h=1200&q=80",
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
    travelSegments: [
      {
        id: "rostov-segment-1",
        fromLabel: "Соборный переулок",
        toLabel: "Центральный рынок",
        durationMinutes: 12,
        transport: { mode: "walking", label: "Пешком", detail: "спокойный центр" },
      },
      {
        id: "rostov-segment-2",
        fromLabel: "Рынок",
        toLabel: "Набережная",
        durationMinutes: 10,
        transport: { mode: "car", label: "Короткое такси", detail: "если группа устала" },
      },
    ],
    transportOptions: [
      { mode: "walking", label: "Пешком" },
      { mode: "car", label: "Такси по запросу" },
    ],
    priceScenarios: [
      {
        id: "rostov-price-2",
        label: "Пара",
        partySize: 2,
        totalRub: 17_000,
        perPersonRub: 8_500,
      },
      {
        id: "rostov-price-4",
        label: "Мини-группа",
        partySize: 4,
        totalRub: 28_000,
        perPersonRub: 7_000,
        note: "Удобно для семьи или компании друзей.",
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
    regionLabel: "Байкал и Восточная Сибирь",
    destinationSlug: "lake-baikal",
    coverImageUrl:
      "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1600&h=1200&q=80",
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
    travelSegments: [
      {
        id: "baikal-segment-1",
        fromLabel: "Иркутск",
        toLabel: "Ледовая точка старта",
        durationMinutes: 90,
        transport: { mode: "car", label: "Трансфер", detail: "утренний выезд" },
      },
      {
        id: "baikal-segment-2",
        fromLabel: "Ледовый маршрут",
        toLabel: "Теплая остановка",
        durationMinutes: 20,
        transport: { mode: "walking", label: "Пешком по льду" },
      },
    ],
    transportOptions: [
      { mode: "car", label: "Трансфер из Иркутска" },
      { mode: "walking", label: "Пешие ледовые участки" },
    ],
    priceScenarios: [
      {
        id: "baikal-price-2",
        label: "Два гостя",
        partySize: 2,
        totalRub: 29_000,
        perPersonRub: 14_500,
      },
      {
        id: "baikal-price-4",
        label: "Четыре гостя",
        partySize: 4,
        totalRub: 52_000,
        perPersonRub: 13_000,
        note: "Лучший баланс цены и темпа на льду.",
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
    regionLabel: "Юг России",
    destinationSlug: "rostov-on-don",
    coverImageUrl:
      "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1600&h=1200&q=80",
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
    travelSegments: [
      {
        id: "azov-segment-1",
        fromLabel: "Ростов-на-Дону",
        toLabel: "Азов",
        durationMinutes: 70,
        transport: { mode: "car", label: "Авто", detail: "утренний выезд" },
      },
    ],
    transportOptions: [{ mode: "car", label: "Авто / минивэн" }],
    priceScenarios: [
      {
        id: "azov-price-3",
        label: "Трое гостей",
        partySize: 3,
        totalRub: 37_500,
        perPersonRub: 12_500,
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
    regionLabel: "Северо-Запад России",
    destinationSlug: "saint-petersburg",
    coverImageUrl:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1600&h=1200&q=80",
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
    travelSegments: [
      {
        id: "spb-segment-1",
        fromLabel: "Невский проспект",
        toLabel: "Дворы-колодцы",
        durationMinutes: 18,
        transport: { mode: "walking", label: "Пешком" },
      },
      {
        id: "spb-segment-2",
        fromLabel: "Финал у Невы",
        toLabel: "Ресторан / отель",
        durationMinutes: 12,
        transport: { mode: "car", label: "Такси по желанию" },
      },
    ],
    transportOptions: [
      { mode: "walking", label: "Пеший маршрут" },
      { mode: "car", label: "Такси по погоде" },
    ],
    priceScenarios: [
      {
        id: "spb-price-2",
        label: "Пара",
        partySize: 2,
        totalRub: 28_400,
        perPersonRub: 14_200,
      },
      {
        id: "spb-price-6",
        label: "Компания",
        partySize: 6,
        totalRub: 63_000,
        perPersonRub: 10_500,
        note: "Подходит для тихого вечернего формата без спешки.",
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
    regionLabel: "Поволжье",
    destinationSlug: "kazan",
    coverImageUrl:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&h=1200&q=80",
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
    travelSegments: [
      {
        id: "kazan-segment-1",
        fromLabel: "Старый город",
        toLabel: "Чайная",
        durationMinutes: 14,
        transport: { mode: "walking", label: "Пешком" },
      },
    ],
    transportOptions: [{ mode: "walking", label: "Пеший вечерний маршрут" }],
    priceScenarios: [
      {
        id: "kazan-price-2",
        label: "Два гостя",
        partySize: 2,
        totalRub: 19_600,
        perPersonRub: 9_800,
      },
      {
        id: "kazan-price-5",
        label: "Пять гостей",
        partySize: 5,
        totalRub: 42_500,
        perPersonRub: 8_500,
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
    regionLabel: "Золотое кольцо",
    coverImageUrl:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&h=1200&q=80",
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
    travelSegments: [
      {
        id: "suzdal-segment-1",
        fromLabel: "Торговая площадь",
        toLabel: "Речной берег",
        durationMinutes: 16,
        transport: { mode: "walking", label: "Пешком" },
      },
    ],
    transportOptions: [{ mode: "walking", label: "Пешком по историческому центру" }],
    priceScenarios: [
      {
        id: "suzdal-price-2",
        label: "Пара",
        partySize: 2,
        totalRub: 17_800,
        perPersonRub: 8_900,
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
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&h=1200&q=80",
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
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1600&h=1200&q=80",
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
