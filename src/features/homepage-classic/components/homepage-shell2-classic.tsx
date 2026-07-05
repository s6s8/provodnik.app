import { OpenGroupCard } from "@/components/shared/open-group-card";
import { SectionHeading } from "@/components/shared/section-heading";
import { SiteFooter } from "@/components/shared/site-footer";
import { formatRubNumber } from "@/data/money";
import type { DestinationOption, RequestRecord } from "@/data/supabase/queries";
import { cityImage } from "@/lib/city-image";

import { HomepageHeroFormClassic } from "./homepage-hero-form-classic";

interface Props {
  destinations: DestinationOption[];
  requests: RequestRecord[];
  viewerId?: string | null;
  preferredGuide?: { slug: string; name: string } | null;
}

const HOW_IT_WORKS = [
  { title: "Опишите поездку", body: "Город, даты, бюджет и интересы" },
  { title: "Гиды откликнутся", body: "Местные гиды предложат маршрут и цену" },
  {
    title: "Выберите гида",
    body: "Сравните отклики, отзывы, цены и выберите гида, прошедшего государственную аккредитацию",
  },
] as const;

const SECTION = "mx-auto w-full max-w-page px-gutter";

export function HomePageShell2Classic({ destinations, requests, viewerId, preferredGuide }: Props) {
  const openGroups = requests.slice(0, 3);

  return (
    <>
      <HomepageHeroFormClassic destinations={destinations} preferredGuide={preferredGuide} />

      {openGroups.length > 0 && (
        <section className={`${SECTION} pb-6 pt-14`} aria-label="Сборные группы">
          <SectionHeading
            title="Сборные группы"
            action={{ label: "Все группы", href: "/requests" }}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  offerCount={req.offerCount}
                  members={req.members}
                  participantCount={req.groupSize}
                  owner={req.travelerId != null && req.travelerId === viewerId}
                  price={req.budgetRub ? `${formatRubNumber(req.budgetRub)} ₽ / чел` : undefined}
                  priority={index === 0}
                />
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-8 border-y border-border bg-surface">
        <div className={`${SECTION} py-14`}>
          <div className="mb-9 text-center">
            <h2 className="text-section font-extrabold tracking-tight text-foreground">
              Как это работает
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step, index) => (
              <div key={step.title} className="flex flex-col items-center gap-2.5 text-center">
                <span className="grid size-12 place-items-center rounded-step bg-primary/10 text-lg font-extrabold text-primary">
                  {index + 1}
                </span>
                <div className="text-base font-bold text-foreground">{step.title}</div>
                <p className="m-0 max-w-xs text-sm font-medium leading-relaxed text-muted-foreground">
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
