export type HomeNavItem = {
  label: string;
  href: string;
  active?: boolean;
};

export type HomeHeroAction = {
  label: string;
  href: string;
  tone: "primary" | "secondary";
};

export type HomeMiniRequest = {
  destination: string;
  datesLabel: string;
  groupLabel: string;
  priceLabel: string;
  href: string;
  badge?: string;
  avatars: string[];
};

export type HomeMiniListing = {
  title: string;
  subtitle: string;
  ratingLabel: string;
  priceLabel: string;
  href: string;
  imageUrl: string;
  guideAvatarUrl: string;
  badge?: string;
};

export type HomeDestination = {
  name: string;
  subtitle: string;
  toursLabel: string;
  imageUrl: string;
  href: string;
  badge?: string;
  featured?: boolean;
  description?: string;
  ctaLabel?: string;
};

export type HomeProcessStep = {
  title: string;
  icon: "search" | "users" | "banknote" | "waypoints" | "check";
};

export type HomeTrustCard = {
  title: string;
  description: string;
  icon: "shield" | "scroll" | "percent";
};

export const homeContainerClass =
  "mx-auto w-full max-w-[1120px] px-4 sm:px-6 lg:px-[3rem]";

export const homepageContent = {
  navItems: [
    { label: "Направления", href: "/destinations", active: true },
    { label: "Запросы", href: "/requests" },
    { label: "Гиды", href: "/guides/maria-rostov" },
    { label: "Экскурсии", href: "/listings" },
    { label: "Профиль", href: "/auth" },
  ] satisfies HomeNavItem[],
  hero: {
    imageUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&h=900&q=85",
    kicker: "Маршруты с локальными проводниками",
    titleLines: [
      "Объединяйтесь. Договаривайтесь.",
      "Путешествуйте по России лучше.",
    ],
    searchPlaceholder: "Куда едем?",
    searchButtonLabel: "Найти",
    actions: [
      { label: "Создать запрос", href: "/requests/new", tone: "primary" },
      { label: "Найти группу", href: "/requests", tone: "secondary" },
    ] satisfies HomeHeroAction[],
  },
  gateway: {
    requests: {
      title: "Биржа запросов",
      description:
        "Присоединяйтесь к путешественникам, собирайте группу и договаривайтесь о цене с местными проводниками.",
      actions: [
        { label: "Создать запрос", href: "/requests/new", tone: "primary" },
        { label: "Найти группу", href: "/requests", tone: "secondary" },
      ] satisfies HomeHeroAction[],
      cards: [
        {
          destination: "Байкал",
          datesLabel: "24-26 июля",
          groupLabel: "4-6 чел.",
          priceLabel: "35-50 тыс. ₽",
          href: "/requests",
          avatars: [
            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&h=200&q=80",
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&h=200&q=80",
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200&q=80",
          ],
        },
        {
          destination: "Алтай",
          datesLabel: "2-5 августа",
          groupLabel: "3-5 чел.",
          priceLabel: "28-42 тыс. ₽",
          href: "/requests",
          avatars: [
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200&q=80",
            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&h=200&q=80",
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&h=200&q=80",
          ],
        },
        {
          destination: "Калмыкия",
          datesLabel: "12-14 сентября",
          groupLabel: "5-7 чел.",
          priceLabel: "22-31 тыс. ₽",
          href: "/requests",
          badge: "Новинка",
          avatars: [
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&h=200&q=80",
            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&h=200&q=80",
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200&q=80",
          ],
        },
      ] satisfies HomeMiniRequest[],
    },
    listings: {
      title: "Готовые предложения",
      description:
        "Выбирайте из действующих туров, сравнивайте формат поездки и бронируйте у локальных гидов.",
      actions: [
        { label: "Смотреть каталог", href: "/listings", tone: "primary" },
        {
          label: "По направлениям",
          href: "/destinations",
          tone: "secondary",
        },
      ] satisfies HomeHeroAction[],
      cards: [
        {
          title: "Камчатка",
          subtitle: "Вулканы и океан",
          ratingLabel: "4.9/5",
          priceLabel: "от 15 000 ₽",
          href: "/listings",
          badge: "Новинка",
          imageUrl:
            "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?auto=format&fit=crop&w=900&h=640&q=80",
          guideAvatarUrl:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=80",
        },
        {
          title: "Алтай",
          subtitle: "Трекинг и озера",
          ratingLabel: "4.9/5",
          priceLabel: "от 18 500 ₽",
          href: "/listings",
          badge: "Хит",
          imageUrl:
            "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=900&h=640&q=80",
          guideAvatarUrl:
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&h=200&q=80",
        },
        {
          title: "Карелия",
          subtitle: "Ладога и шхеры",
          ratingLabel: "4.8/5",
          priceLabel: "от 14 000 ₽",
          href: "/listings",
          imageUrl:
            "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&h=640&q=80",
          guideAvatarUrl:
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200&q=80",
        },
      ] satisfies HomeMiniListing[],
    },
  },
  destinations: {
    title: "Популярные направления",
    cards: [
      {
        name: "Озеро Байкал",
        subtitle: "Иркутск и Большое Голоустное",
        toursLabel: "24 тура",
        href: "/destinations/lake-baikal",
        featured: true,
        ctaLabel: "Смотреть туры",
        description:
          "Большая вода, утренний свет и маршруты с локальными проводниками у берега.",
        imageUrl:
          "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&h=1200&q=80",
      },
      {
        name: "Казань",
        subtitle: "Кремль",
        toursLabel: "14 туров",
        href: "/destinations/kazan",
        badge: "Новинка",
        imageUrl:
          "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=900&h=800&q=80",
      },
      {
        name: "Калининград",
        subtitle: "Янтарный берег",
        toursLabel: "20 туров",
        href: "/listings/kaliningrad-dunes-courtyards",
        badge: "Хит",
        imageUrl:
          "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&h=800&q=80",
      },
      {
        name: "Суздаль",
        subtitle: "Древний маршрут",
        toursLabel: "16 туров",
        href: "/listings/suzdal-morning-bells",
        badge: "Новинка",
        imageUrl:
          "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=900&h=800&q=80",
      },
      {
        name: "Мурманск",
        subtitle: "Северное сияние",
        toursLabel: "19 туров",
        href: "/listings/murmansk-northern-coast",
        badge: "Новинка",
        imageUrl:
          "https://images.unsplash.com/photo-1527489377706-5bf97e608852?auto=format&fit=crop&w=900&h=800&q=80",
      },
    ] satisfies HomeDestination[],
  },
  process: {
    title: "Как это работает",
    steps: [
      { title: "Создать запрос", icon: "search" },
      { title: "Группа формируется", icon: "users" },
      { title: "Гиды предлагают цену", icon: "banknote" },
      { title: "Договариваетесь", icon: "waypoints" },
      { title: "Экскурсия подтверждена", icon: "check" },
    ] satisfies HomeProcessStep[],
  },
  trust: {
    cards: [
      {
        title: "Проверенные гиды",
        description:
          "Профили с подтвержденным опытом, отзывами и прозрачной специализацией.",
        icon: "shield",
      },
      {
        title: "Прозрачные условия",
        description:
          "Понятная цена, состав группы и маршрут без скрытых условий в переписке.",
        icon: "scroll",
      },
      {
        title: "Комиссия ниже крупных агрегаторов",
        description:
          "Больше ценности для путешественников и локальных проводников без лишней наценки.",
        icon: "percent",
      },
    ] satisfies HomeTrustCard[],
  },
  footer: {
    about: {
      title: "О нас",
      lines: [
        "Платформа для путешествий по России",
        "с локальными проводниками и открытыми группами.",
      ],
    },
    columns: [
      {
        title: "Помощь",
        links: [
          { label: "Как это работает", href: "#process" },
          { label: "Безопасность и доверие", href: "/trust" },
          { label: "Войти в профиль", href: "/auth" },
        ],
      },
      {
        title: "Правила",
        links: [
          { label: "Возвраты", href: "/policies/refunds" },
          { label: "Отмена бронирования", href: "/policies/cancellation" },
          { label: "Для гидов", href: "/guide" },
        ],
      },
    ],
    socialLinks: [
      { label: "VK", href: "https://vk.com" },
      { label: "Telegram", href: "https://t.me" },
      { label: "Instagram", href: "https://instagram.com" },
    ],
    legal: {
      copyright: "© 2024 Provodnik. Все права защищены.",
      links: [
        { label: "Возвраты", href: "/policies/refunds" },
        { label: "Отмена бронирования", href: "/policies/cancellation" },
      ],
    },
  },
} as const;
