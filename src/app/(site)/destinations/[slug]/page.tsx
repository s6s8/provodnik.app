import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArrowRight,
  CalendarDays,
  MapPinned,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketplaceHero } from "@/components/shared/marketplace";
import {
  MarketplaceMetricCard,
  MarketplaceResultsHeader,
  MarketplaceSectionHeader,
  MarketplaceRequestCard,
} from "@/components/shared/marketplace";
import { getSeededOpenRequests } from "@/data/open-requests/seed";
import type { OpenRequestRecord } from "@/data/open-requests/types";
import { seededPublicListings } from "@/data/public-listings/seed";
import type { PublicListing } from "@/data/public-listings/types";
import { seededPublicGuides } from "@/data/public-guides/seed";
import type { PublicGuideProfile } from "@/data/public-guides/types";
import { PublicListingCard } from "@/features/listings/components/public/public-listing-card";

type DestinationSlug =
  | "altai"
  | "saint-petersburg"
  | "kazan"
  | "suzdal"
  | "kaliningrad"
  | "murmansk";

type DestinationConfig = {
  slug: DestinationSlug;
  label: string;
  heroTitle: string;
  heroDescription: string;
  heroBadges: string[];
  openRequestLabels: string[];
  listingCities?: string[];
  listingRegions?: string[];
  guideRegions?: string[];
};

const DESTINATIONS: Record<DestinationSlug, DestinationConfig> = {
  altai: {
    slug: "altai",
    label: "Алтай",
    heroTitle: "Алтай без героизации: тропы, виды и реальный темп поездки",
    heroDescription:
      "Эта страница собирает открытые группы, подходящие туры и гидов вокруг Алтая. Сначала видны живые запросы и формирующиеся группы, а не только витрина из готовых туров.",
    heroBadges: [
      "Походы и виды",
      "Небольшие группы",
      "Запрос‑первый вход",
    ],
    openRequestLabels: ["Altai"],
    listingCities: [],
    listingRegions: [],
    guideRegions: [],
  },
  "saint-petersburg": {
    slug: "saint-petersburg",
    label: "Санкт-Петербург",
    heroTitle: "Петербург по спросу: белые ночи, вода и тихие дворы",
    heroDescription:
      "Страница объединяет открытые запросы, маршруты и гидов по Петербургу. Можно начать с живой группы, подобрать экскурсию или оформить свой запрос под даты и формат.",
    heroBadges: [
      "Белые ночи и вода",
      "Спокойный городской темп",
      "Маршруты от редакционного гида",
    ],
    openRequestLabels: ["Saint Petersburg"],
    listingCities: ["Санкт-Петербург"],
    listingRegions: ["Санкт-Петербург"],
    guideRegions: ["Санкт-Петербург", "Ленинградская область"],
  },
  kazan: {
    slug: "kazan",
    label: "Казань",
    heroTitle: "Казань вечером: гастрономия, старый город и спокойный темп",
    heroDescription:
      "Здесь собраны маршруты и гиды по Казани, вокруг вечерних прогулок, чая и татарской кухни. Если формирующейся группы ещё нет, можно запустить поездку с собственного запроса.",
    heroBadges: [
      "Вечерние прогулки",
      "Чай и гастрономия",
      "Семейный формат",
    ],
    openRequestLabels: [],
    listingCities: ["Казань"],
    listingRegions: ["Республика Татарстан"],
    guideRegions: ["Казань", "Республика Татарстан"],
  },
  suzdal: {
    slug: "suzdal",
    label: "Суздаль",
    heroTitle: "Суздаль в медленном ритме: монастыри, луга и утренний свет",
    heroDescription:
      "Страница для тех, кто хочет увидеть Суздаль без спешки: готовые утренние маршруты, профиль гида и короткий путь к заявке, если нужно что‑то особенное.",
    heroBadges: ["Медленный темп", "Утренний свет", "Маршруты с детьми"],
    openRequestLabels: [],
    listingCities: ["Суздаль"],
    listingRegions: ["Владимирская область"],
    guideRegions: ["Суздаль", "Владимирская область"],
  },
  kaliningrad: {
    slug: "kaliningrad",
    label: "Калининград и побережье",
    heroTitle:
      "Калининград и Куршская коса: город, виллы и берег за одну уверенную поездку",
    heroDescription:
      "Подборка маршрутов и гидов по Калининграду и побережью. Важно не закрыть все точки, а провести день так, чтобы хватило и на город, и на море без хаотичной логистики.",
    heroBadges: ["Берег и дюны", "Сбалансированная логистика", "Малые группы"],
    openRequestLabels: [],
    listingCities: ["Калининград"],
    listingRegions: ["Калининградская область"],
    guideRegions: ["Калининград", "Куршская коса"],
  },
  murmansk: {
    slug: "murmansk",
    label: "Мурманск и северный берег",
    heroTitle:
      "Север без героизации: Мурманск, тундра и мягкий свет Баренцева моря",
    heroDescription:
      "Страница собирает маршруты и гидов по северному направлению. Можно оценить, как выглядит реальный день на берегу, и сразу уйти в запрос под свои даты и формат.",
    heroBadges: ["Несезонные поездки", "Мягкий северный свет", "Малые группы"],
    openRequestLabels: [],
    listingCities: ["Мурманск"],
    listingRegions: ["Мурманская область"],
    guideRegions: ["Мурманск", "Кольский полуостров"],
  },
};

function getDestinationConfig(slug: string): DestinationConfig | null {
  if (!slug) return null;
  const key = slug as DestinationSlug;
  return DESTINATIONS[key] ?? null;
}

function getDestinationOpenRequests(config: DestinationConfig): OpenRequestRecord[] {
  const all = getSeededOpenRequests();
  return all.filter((item) => config.openRequestLabels.includes(item.destinationLabel));
}

function getDestinationListings(config: DestinationConfig): PublicListing[] {
  return seededPublicListings.filter((listing) => {
    const byCity =
      config.listingCities &&
      config.listingCities.length > 0 &&
      config.listingCities.includes(listing.city);
    const byRegion =
      config.listingRegions &&
      config.listingRegions.length > 0 &&
      config.listingRegions.includes(listing.region);
    return byCity || byRegion;
  });
}

function getDestinationGuides(config: DestinationConfig): PublicGuideProfile[] {
  if (!config.guideRegions || config.guideRegions.length === 0) {
    return [];
  }

  return seededPublicGuides.filter((guide) => {
    if (config.guideRegions?.includes(guide.homeBase)) return true;
    return guide.regions.some((region) => config.guideRegions?.includes(region));
  });
}

export function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  return params.then(({ slug }) => {
    const config = getDestinationConfig(slug);
    if (!config) {
      return {
        title: "Направление не найдено",
      };
    }

    return {
      title: `${config.label} | Направление Provodnik`,
      description: config.heroDescription,
    };
  });
}

export default async function DestinationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = getDestinationConfig(slug);
  if (!config) notFound();

  const openRequests = getDestinationOpenRequests(config);
  const listings = getDestinationListings(config);
  const guides = getDestinationGuides(config);

  return (
    <div className="space-y-10">
      <MarketplaceHero
        icon={MapPinned}
        eyebrow="Направление"
        title={config.heroTitle}
        description={config.heroDescription}
        badges={config.heroBadges}
        rightColumn={
          <>
            <MarketplaceMetricCard
              eyebrow="Открытые группы"
              value={openRequests.length.toString()}
              description="Сейчас на этом направлении есть публичные запросы, к которым можно присоединиться или оттолкнуться при создании своего."
            />
            <MarketplaceMetricCard
              eyebrow="Готовые маршруты"
              value={listings.length.toString()}
              description="Подборка туров от локальных гидов. Можно сравнить форматы, а затем уйти в запрос, если нужен другой темп или даты."
            />
            <MarketplaceMetricCard
              eyebrow="Проводники"
              value={guides.length.toString()}
              description="Гиды, которые уже ведут группы в этом регионе. Их профили помогают понять стиль ведения поездок до бронирования."
            />
          </>
        }
      />

      <section className="space-y-4">
        <MarketplaceSectionHeader
          icon={Users}
          title="Открытые группы и запросы"
          description="Посмотрите, какие поездки уже формируются, и решите, присоединяться или запускать свой сценарий."
        />

        <MarketplaceResultsHeader
          label="Найдено запросов на это направление"
          value={openRequests.length}
          right={
            <Button asChild className="rounded-full px-5">
              <Link href="/traveler">
                Оставить запрос под ваши даты
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          }
        />

        <div className="grid gap-4 lg:grid-cols-2">
          {openRequests.map((item) => (
            <MarketplaceRequestCard
              key={item.id}
              title={item.destinationLabel}
              subtitle={item.dateRangeLabel}
              badgeLabel={item.visibility === "public" ? "Публичный запрос" : "По приглашению"}
              meta={[
                {
                  label: `Группа ${item.group.sizeCurrent}/${item.group.sizeTarget}`,
                },
                {
                  label:
                    item.group.openToMoreMembers && item.group.sizeCurrent < item.group.sizeTarget
                      ? `Осталось ${item.group.sizeTarget - item.group.sizeCurrent} мест`
                      : "Набор закрыт",
                },
              ]}
              highlights={item.highlights.join(" · ")}
              footerRight={
                <Button asChild variant="secondary">
                  <Link href="/requests">Смотреть доску запросов</Link>
                </Button>
              }
            />
          ))}
        </div>

        {openRequests.length === 0 ? (
          <Card className="border-dashed border-border/70 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base">
                Пока нет открытых групп на это направление
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Маркетплейс строится вокруг запросов. Если вы не нашли подходящую группу, можно
                начать поездку с собственного запроса — он появится в личном кабинете
                путешественника и может лечь в основу публичной карточки.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" className="rounded-full">
                  <Link href="/traveler">Создать запрос</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="rounded-full">
                  <Link href="/requests">Смотреть существующие запросы</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </section>

      <section className="space-y-4">
        <MarketplaceSectionHeader
          icon={CalendarDays}
          title="Готовые маршруты по направлению"
          description="Подборка туров от локальных гидов. Это способ быстро оценить формат и атмосферу поездок."
        />

        <MarketplaceResultsHeader
          label="Найдено маршрутов"
          value={listings.length}
          right={
            <Button asChild variant="outline" className="rounded-full px-5">
              <Link href="/listings">
                Открыть весь каталог
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          }
        />

        <div className="grid gap-5 lg:grid-cols-3">
          {listings.map((listing) => (
            <PublicListingCard key={listing.slug} listing={listing} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <MarketplaceSectionHeader
          icon={Users}
          title="Гиды, работающие в регионе"
          description="Посмотрите, кто ведет поездки по этому направлению и какие у них сигналы доверия."
        />

        <MarketplaceResultsHeader
          label="Найдено гидов"
          value={guides.length}
          right={
            <Button asChild variant="outline" className="rounded-full px-5">
              <Link href="/guides">
                Смотреть всех гидов
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <Card key={guide.slug} className="border-border/70 bg-card/90">
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">{guide.displayName}</CardTitle>
                <p className="text-sm text-muted-foreground">{guide.headline}</p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  База: {guide.homeBase}. Работает в регионах:{" "}
                  {guide.regions.join(", ")}.
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {guide.specialties.slice(0, 3).map((specialty) => (
                    <span
                      key={specialty}
                      className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
                <Button asChild size="sm" className="mt-1 rounded-full">
                  <Link href={`/guides/${guide.slug}`}>Открыть профиль</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

