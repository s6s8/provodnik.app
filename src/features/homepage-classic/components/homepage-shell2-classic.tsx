import { DestinationTile } from "@/components/shared/destination-tile";
import { OpenGroupCard } from "@/components/shared/open-group-card";
import { SectionHeading } from "@/components/shared/section-heading";
import { SiteFooter } from "@/components/shared/site-footer";
import type { DestinationOption, RequestRecord } from "@/data/supabase/queries";
import { cityImage } from "@/lib/city-image";
import { pluralize } from "@/lib/utils";

import { HomepageHeroFormClassic } from "./homepage-hero-form-classic";

interface Props {
  destinations: DestinationOption[];
  requests: RequestRecord[];
}

const HOW_IT_WORKS = [
  { title: "Опишите поездку", body: "Город, даты, бюджет и интересы" },
  { title: "Гиды откликнутся", body: "Местные гиды предложат маршрут и цену" },
  {
    title: "Выберите гида",
    body: "Сравните отклики, отзывы, цены и выберите гида, прошедшего государственную аккредитацию",
  },
] as const;

const SECTION = "mx-auto w-full max-w-[1180px] px-[clamp(20px,4vw,44px)]";

function offersFooter(offerCount: number): string {
  if (offerCount <= 0) return "Пока нет откликов";
  return `${offerCount} ${pluralize(offerCount, "отклик", "отклика", "откликов")}`;
}

export function HomePageShell2Classic({ destinations, requests }: Props) {
  const openGroups = requests.slice(0, 3);
  const popularDestinations = destinations.slice(0, 6);

  return (
    <>
      <HomepageHeroFormClassic destinations={destinations} />

      {openGroups.length > 0 && (
        <section className={`${SECTION} pb-6 pt-[clamp(40px,6vw,62px)]`} aria-label="Открытые группы">
          <SectionHeading
            title="Открытые группы"
            subtitle="Займите место рядом с местным гидом"
            action={{ label: "Все группы", href: "/requests" }}
          />
          <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
            {openGroups.map((req, index) => {
              const city = req.destination.split(",")[0].trim();
              const selected = req.status === "booked";
              return (
                <OpenGroupCard
                  key={req.id}
                  href={`/requests/${req.id}`}
                  city={city}
                  region={req.destinationRegion}
                  imageUrl={cityImage(city)}
                  status={selected ? "selected" : "waiting"}
                  minPeople={`от ${req.capacity ?? req.groupSize} чел.`}
                  date={req.dateLabel}
                  datesFlexible={req.dateFlexibility === "few_days"}
                  time={
                    req.startTime
                      ? `${req.startTime}${req.endTime ? `–${req.endTime}` : ""}`
                      : undefined
                  }
                  interests={req.interests}
                  avatarUrl={req.requesterAvatarUrl}
                  avatarInitials={req.requesterInitials}
                  footerText={selected ? "Гид найден" : offersFooter(req.offerCount)}
                  priority={index === 0}
                />
              );
            })}
          </div>
        </section>
      )}

      {popularDestinations.length > 0 && (
        <section className={`${SECTION} pb-6 pt-[30px]`} aria-label="Популярные направления">
          <SectionHeading
            title="Популярные направления"
            action={{ label: "Все направления", href: "/destinations" }}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popularDestinations.map((d) => (
              <DestinationTile
                key={`${d.name}-${d.region}`}
                href={`/listings?q=${encodeURIComponent(d.name)}`}
                name={d.name}
                imageUrl={cityImage(d.name)}
                guidesCount={d.guideCount}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mt-[30px] border-y border-border bg-surface">
        <div className={`${SECTION} py-[54px]`}>
          <div className="mb-9 text-center">
            <h2 className="text-[clamp(24px,3vw,30px)] font-extrabold tracking-[-0.03em] text-foreground">
              Как это работает
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step, index) => (
              <div key={step.title} className="flex flex-col items-center gap-2.5 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-primary/10 text-[19px] font-extrabold text-primary">
                  {index + 1}
                </span>
                <div className="text-[17px] font-bold text-foreground">{step.title}</div>
                <p className="m-0 max-w-[26ch] text-sm font-medium leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
