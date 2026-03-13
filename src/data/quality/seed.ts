export type QualityTier = "strong" | "watch" | "risk";

export type MarketplaceQualitySnapshot = {
  responseTimeHours: number;
  completionRate: number;
  cancellationRate: number;
  tier: QualityTier;
  visibilityLabel: string;
  visibilityNote: string;
};

const GUIDE_QUALITY_BY_SLUG: Record<string, MarketplaceQualitySnapshot> = {
  "maria-rostov": {
    responseTimeHours: 1.6,
    completionRate: 98,
    cancellationRate: 1,
    tier: "strong",
    visibilityLabel: "Высокий приоритет",
    visibilityNote:
      "Быстрые ответы и почти нулевые отмены помогают этому гиду чаще показываться в каталоге и в распределении заявок.",
  },
  "elena-kazan": {
    responseTimeHours: 3.8,
    completionRate: 95,
    cancellationRate: 3,
    tier: "watch",
    visibilityLabel: "Нормально, но под наблюдением",
    visibilityNote:
      "Предложение остается видимым, но более медленный отклик ухудшает позицию по сравнению с более быстрыми гидами.",
  },
  "artem-sochi": {
    responseTimeHours: 7.4,
    completionRate: 89,
    cancellationRate: 6,
    tier: "risk",
    visibilityLabel: "Риск снижения видимости",
    visibilityNote:
      "Долгий ответ и повышенные отмены уменьшают видимость, пока качество не выровняется.",
  },
};

const LISTING_QUALITY_BY_SLUG: Record<string, MarketplaceQualitySnapshot> = {
  "rostov-river-port-evening-walk": {
    responseTimeHours: 1.8,
    completionRate: 97,
    cancellationRate: 2,
    tier: "strong",
    visibilityLabel: "Сильная карточка",
    visibilityNote:
      "Этот маршрут поддерживается сильным профилем гида и чаще получает хорошее место в выдаче.",
  },
  "kazan-food-walk-hidden-tea-rooms": {
    responseTimeHours: 3.2,
    completionRate: 94,
    cancellationRate: 3,
    tier: "watch",
    visibilityLabel: "Конкурентно, но не лидирует",
    visibilityNote:
      "Качество достаточное для поиска, но в пиковые периоды маршрут может уступать более быстрым предложениям.",
  },
  "sochi-off-season-photo-route": {
    responseTimeHours: 6.8,
    completionRate: 90,
    cancellationRate: 5,
    tier: "risk",
    visibilityLabel: "Нужно восстановить качество",
    visibilityNote:
      "Площадка уменьшает охват, когда скорость ответа и надежность проведения падают ниже желаемого уровня.",
  },
};

const DEFAULT_GUIDE_QUALITY: MarketplaceQualitySnapshot = {
  responseTimeHours: 2.5,
  completionRate: 95,
  cancellationRate: 3,
  tier: "watch",
  visibilityLabel: "Нейтральная видимость",
  visibilityNote:
    "Карточка держится в выдаче лучше, когда ответы быстрые, экскурсии проходят стабильно, а отмен мало.",
};

export function getGuideQualitySnapshot(slug: string): MarketplaceQualitySnapshot {
  return GUIDE_QUALITY_BY_SLUG[slug] ?? DEFAULT_GUIDE_QUALITY;
}

export function getListingQualitySnapshot(slug: string): MarketplaceQualitySnapshot {
  return LISTING_QUALITY_BY_SLUG[slug] ?? DEFAULT_GUIDE_QUALITY;
}
