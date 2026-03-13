import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Lora, Plus_Jakarta_Sans, Roboto_Mono } from "next/font/google";
import {
  ArrowRight,
  CalendarDays,
  Compass,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import { seededPublicGuides } from "@/data/public-guides/seed";
import { seededPublicListings } from "@/data/public-listings/seed";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-plus-jakarta-home",
});

const lora = Lora({
  subsets: ["latin", "cyrillic"],
  variable: "--font-lora-home",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-roboto-mono-home",
});

const homeTheme = {
  "--card": "#f5f5f4",
  "--ring": "#6366f1",
  "--input": "#d6d3d1",
  "--muted": "#e7e5e4",
  "--accent": "#f3e5f5",
  "--border": "#d6d3d1",
  "--radius": "1.25rem",
  "--chart-1": "#6366f1",
  "--chart-2": "#4f46e5",
  "--chart-3": "#4338ca",
  "--chart-4": "#3730a3",
  "--chart-5": "#312e81",
  "--popover": "#f5f5f4",
  "--primary": "#6366f1",
  "--sidebar": "#d6d3d1",
  "--font-mono": robotoMono.style.fontFamily,
  "--font-sans": plusJakarta.style.fontFamily,
  "--secondary": "#d6d3d1",
  "--background": "#e7e5e4",
  "--font-serif": lora.style.fontFamily,
  "--foreground": "#1e293b",
  "--destructive": "#ef4444",
  "--shadow-blur": "10px",
  "--shadow-color": "hsl(240 4% 60%)",
  "--sidebar-ring": "#6366f1",
  "--shadow-spread": "4px",
  "--shadow-opacity": "0.18",
  "--sidebar-accent": "#f3e5f5",
  "--sidebar-border": "#d6d3d1",
  "--card-foreground": "#1e293b",
  "--shadow-offset-x": "2px",
  "--shadow-offset-y": "2px",
  "--sidebar-primary": "#6366f1",
  "--muted-foreground": "#6b7280",
  "--accent-foreground": "#374151",
  "--popover-foreground": "#1e293b",
  "--primary-foreground": "#ffffff",
  "--sidebar-foreground": "#1e293b",
  "--secondary-foreground": "#4b5563",
  "--destructive-foreground": "#ffffff",
  "--sidebar-accent-foreground": "#374151",
  "--sidebar-primary-foreground": "#ffffff",
} as CSSProperties;

const listingImages: Record<string, string> = {
  "rostov-food-walk":
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&h=900&q=80",
  "baikal-ice-safety-day":
    "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1200&h=900&q=80",
  "rostov-day-trip-azov":
    "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&h=900&q=80",
};

const highlightRows = [
  {
    label: "Быстрый выбор",
    title: "Каталог без шума",
    description:
      "Сразу видно город, длительность, формат группы и отправную цену без длинного вступления.",
  },
  {
    label: "Доверие",
    title: "Отзывы и правила на виду",
    description:
      "У гида есть рейтинг, специализация и прозрачные правила отмены до оформления заявки.",
  },
  {
    label: "Гибкость",
    title: "Можно не искать идеальный тур",
    description:
      "Если готового маршрута нет, оставляете заявку под даты и получаете предложение от гида.",
  },
] as const;

export function Page3HomePage() {
  const featuredListings = seededPublicListings.slice(0, 3);
  const featuredGuides = seededPublicGuides.slice(0, 2);

  return (
    <div
      style={homeTheme}
      className={`${plusJakarta.variable} ${lora.variable} ${robotoMono.variable} space-y-10 [font-family:var(--font-sans)] text-[var(--foreground)]`}
    >
      <section className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--card)] shadow-[2px_2px_10px_4px_hsl(240_4%_60%_/_.18)]">
        <div className="grid gap-8 px-5 py-6 sm:px-8 sm:py-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-stretch">
          <div className="flex flex-col justify-between gap-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                <Sparkles className="size-4 text-[var(--primary)]" />
                Новый взгляд на бронирование экскурсий
              </div>

              <div className="space-y-4">
                <h1 className="max-w-3xl text-balance text-5xl font-semibold leading-none tracking-[-0.05em] [font-family:var(--font-serif)] sm:text-6xl xl:text-7xl">
                  Экскурсии по России, которые выглядят как настоящее путешествие.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-[var(--muted-foreground)] sm:text-lg">
                  Provodnik собирает городские маршруты, поездки на природу и
                  гастрономические выходные в формате, где хочется бронировать.
                  Впечатление, программа, гид и правила сервиса видны сразу.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/listings"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-[var(--primary-foreground)] transition-transform hover:-translate-y-0.5"
                >
                  Смотреть каталог
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/traveler"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition-transform hover:-translate-y-0.5"
                >
                  Оставить заявку под даты
                </Link>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <HomeFact
                icon={<MapPin className="size-4" />}
                title="Города и регионы"
                value="Ростов, Азов, Байкал, Карелия"
              />
              <HomeFact
                icon={<Users className="size-4" />}
                title="Формат группы"
                value="Пары, семьи и небольшие компании"
              />
              <HomeFact
                icon={<ShieldCheck className="size-4" />}
                title="Проверка сервиса"
                value="Отзывы, модерация и ясные условия"
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="grid gap-4">
              <HighlightTile
                icon={<Compass className="size-4" />}
                title="Под настроение поездки"
                text="Сначала выбираете атмосферу: еда, природа, история или короткий городской день."
              />
              <HighlightTile
                icon={<CalendarDays className="size-4" />}
                title="Под реальные даты"
                text="Если нужного маршрута нет, сервис ведет в заявку, а не оставляет пользователя наедине с каталогом."
              />
            </div>

            <div className="relative min-h-[25rem] overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[linear-gradient(160deg,var(--chart-1),var(--chart-4))]">
              <Image
                src={listingImages[featuredListings[0].slug]}
                alt={featuredListings[0].title}
                fill
                sizes="(max-width: 1280px) 100vw, 40vw"
                className="object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08),rgba(15,23,42,0.75))]" />
              <div className="relative flex h-full flex-col justify-between p-5 text-white sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-white/16 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur">
                    Главный маршрут недели
                  </span>
                  <span className="rounded-full bg-white/14 px-3 py-1 text-sm backdrop-blur">
                    от {featuredListings[0].priceFromRub.toLocaleString("ru-RU")} ₽
                  </span>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-white/82">{featuredListings[0].city}</p>
                  <h2 className="max-w-md text-3xl font-semibold leading-tight [font-family:var(--font-serif)]">
                    {featuredListings[0].title}
                  </h2>
                  <p className="max-w-md text-sm leading-7 text-white/80">
                    {featuredListings[0].highlights[0]}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {highlightRows.map((item) => (
          <article
            key={item.title}
            className="rounded-[1.6rem] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[2px_2px_10px_4px_hsl(240_4%_60%_/_.12)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
              {item.label}
            </p>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight [font-family:var(--font-serif)]">
              {item.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
              {item.description}
            </p>
          </article>
        ))}
      </section>

      <section className="space-y-5 rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[2px_2px_10px_4px_hsl(240_4%_60%_/_.12)] sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
              Готовые маршруты
            </p>
            <h2 className="text-4xl font-semibold tracking-tight [font-family:var(--font-serif)]">
              Каталог, который показывает впечатление, а не только карточку товара
            </h2>
          </div>
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]"
          >
            Открыть весь каталог
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          {featuredListings.map((listing) => (
            <article
              key={listing.slug}
              className="overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--background)]"
            >
              <div className="relative h-56 overflow-hidden">
                <Image
                  src={listingImages[listing.slug]}
                  alt={listing.title}
                  fill
                  sizes="(max-width: 1280px) 100vw, 30vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04),rgba(15,23,42,0.64))]" />
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[var(--foreground)]">
                    {listing.city}
                  </span>
                  <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-[var(--accent-foreground)]">
                    {listing.durationDays}{" "}
                    {listing.durationDays === 1 ? "день" : "дня"}
                  </span>
                </div>
              </div>
              <div className="space-y-4 p-5">
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold leading-tight tracking-tight [font-family:var(--font-serif)]">
                    {listing.title}
                  </h3>
                  <p className="text-sm leading-7 text-[var(--muted-foreground)]">
                    {listing.highlights[1]}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {listing.themes.map((theme) => (
                    <span
                      key={theme}
                      className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium text-[var(--secondary-foreground)]"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-[var(--border)] pt-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                      цена от
                    </p>
                    <p className="mt-1 text-2xl font-semibold">
                      {listing.priceFromRub.toLocaleString("ru-RU")} ₽
                    </p>
                  </div>
                  <Link
                    href={`/listings/${listing.slug}`}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[var(--primary-foreground)]"
                  >
                    Смотреть
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[2px_2px_10px_4px_hsl(240_4%_60%_/_.12)] sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
            Люди, которые ведут маршрут
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight [font-family:var(--font-serif)]">
            Гид здесь выглядит как человек, которому можно доверить день поездки
          </h2>
          <div className="mt-6 grid gap-4">
            {featuredGuides.map((guide) => (
              <article
                key={guide.slug}
                className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--background)] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold tracking-tight">
                      {guide.displayName}
                    </h3>
                    <p className="text-sm leading-7 text-[var(--muted-foreground)]">
                      {guide.headline}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)] px-3 py-1 text-sm font-semibold text-[var(--accent-foreground)]">
                    <Star className="size-4 fill-current" />
                    {guide.reviewsSummary.averageRating.toFixed(1)}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {guide.specialties.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium text-[var(--secondary-foreground)]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between gap-4">
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {guide.reviewsSummary.totalReviews} отзывов · {guide.yearsExperience}+ лет опыта
                  </p>
                  <Link
                    href={`/guides/${guide.slug}`}
                    className="text-sm font-semibold text-[var(--primary)]"
                  >
                    Профиль гида
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[2rem] border border-[var(--border)] bg-[linear-gradient(135deg,var(--chart-1),var(--chart-3))] p-6 text-white shadow-[2px_2px_10px_4px_hsl(240_4%_60%_/_.18)] sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
              Заявка вместо тупика
            </p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight tracking-tight [font-family:var(--font-serif)]">
              Не нашли идеальный маршрут? Сервис должен помочь, а не закончиться каталогом.
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/80">
              В Provodnik можно уйти из витрины в персональный запрос: даты, бюджет,
              формат группы и пожелания к гиду. Это важнее для MVP, чем просто
              добавить больше карточек.
            </p>
            <Link
              href="/traveler/requests/new"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--chart-3)]"
            >
              Создать заявку
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <InfoNote title="Условия отмены">
              До оплаты видно, какие сценарии отмены и возврата применяются к поездке.
            </InfoNote>
            <InfoNote title="Операторская поддержка">
              Если что-то пошло не так, спор идет в системную очередь, а не теряется в переписке.
            </InfoNote>
            <InfoNote title="Фокус на бронировании">
              Главная должна вести к действию: выбрать тур, изучить гида или оставить заявку.
            </InfoNote>
          </div>
        </div>
      </section>
    </div>
  );
}

function HomeFact({
  icon,
  title,
  value,
}: {
  icon: ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.3rem] border border-[var(--border)] bg-[var(--background)] p-4">
      <div className="flex items-center gap-2 text-[var(--primary)]">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
          {title}
        </span>
      </div>
      <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function HighlightTile({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--background)] p-5 shadow-[2px_2px_10px_4px_hsl(240_4%_60%_/_.12)]">
      <div className="flex size-11 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--chart-3)]">
        {icon}
      </div>
      <h2 className="mt-4 text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">{text}</p>
    </div>
  );
}

function InfoNote({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[2px_2px_10px_4px_hsl(240_4%_60%_/_.12)]">
      <p className="text-lg font-semibold tracking-tight">{title}</p>
      <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">{children}</p>
    </article>
  );
}
