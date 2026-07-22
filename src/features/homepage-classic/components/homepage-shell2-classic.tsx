import { OpenGroupCard } from "@/components/shared/open-group-card";
import { SectionHeading } from "@/components/shared/section-heading";
import { SiteFooter } from "@/components/shared/site-footer";
import { StepCard } from "@/components/shared/step-card";
import { formatRubNumber } from "@/data/money";
import type {
  DestinationOption,
  GuideRecord,
  ListingRecord,
  RequestRecord,
} from "@/data/supabase/queries";
import { cityImage } from "@/lib/city-image";
import type { HomepageReview } from "@/lib/supabase/homepage";
import { Compass } from "lucide-react";

import { HomepageHeroFormClassic } from "./homepage-hero-form-classic";
import { HomepageInventoryClassic, HomepageListingsClassic } from "./homepage-inventory-classic";
import type { TemplateRequestPrefill } from "./template-request-prefill";

interface Props {
  destinations: DestinationOption[];
  /** Wider search vocabulary (city + region + guide directions) for the form combobox. */
  searchDestinations?: DestinationOption[];
  requests: RequestRecord[];
  viewerId?: string | null;
  preferredGuide?: { slug: string; name: string; templateId?: string | null } | null;
  templatePrefill?: TemplateRequestPrefill | null;
  joinedRequestIds?: Set<string>;
  listings?: ListingRecord[];
  guides?: GuideRecord[];
  reviews?: HomepageReview[];
  /** Mirrors FEATURE_PUBLIC_CATALOG — gates links into /listings. */
  publicCatalogEnabled?: boolean;
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

export function HomePageShell2Classic({
  destinations,
  searchDestinations,
  requests,
  viewerId,
  preferredGuide,
  templatePrefill,
  joinedRequestIds = new Set(),
  listings = [],
  guides = [],
  reviews = [],
  publicCatalogEnabled = true,
}: Props) {
  const openGroups = requests.slice(0, 3);

  return (
    <>
      <HomepageHeroFormClassic
        destinations={searchDestinations ?? destinations}
        preferredGuide={preferredGuide}
        templatePrefill={templatePrefill}
        hasGroups={openGroups.length > 0}
      />

      {openGroups.length > 0 && (
        // pt-10, not pt-14: this section is what the first screen has to reveal, and
        // its own top padding is the last thing between the fold and its heading.
        <section id="groups" className={`${SECTION} scroll-mt-nav-h pb-6 pt-10`} aria-label="Сборные группы">
          <SectionHeading
            title="Сборные группы"
            action={{ label: "Все группы", href: "/requests" }}
            secondaryAction={
              publicCatalogEnabled
                ? {
                    label: "Готовые экскурсии",
                    href: "/listings",
                    icon: Compass,
                  }
                : undefined
            }
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
                  timeFlexible={req.dateFlexibility === "few_days"}
                  time={
                    req.dateFlexibility === "few_days"
                      ? undefined
                      : req.startTime
                        ? `${req.startTime}${req.endTime ? `–${req.endTime}` : ""}`
                        : undefined
                  }
                  interests={req.interests}
                  offerCount={req.offerCount}
                  members={req.members}
                  participantCount={req.groupSize}
                  owner={req.travelerId != null && req.travelerId === viewerId}
                  member={joinedRequestIds.has(req.id)}
                  price={req.budgetRub ? `${formatRubNumber(req.budgetRub)} ₽ / чел` : undefined}
                  priority={index === 0}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Directly after «Сборные группы»: the two ways to travel — join a group or
          take a ready excursion — belong together, ahead of the explainer. */}
      <HomepageListingsClassic listings={listings} />

      <section className="mt-8 border-y border-border bg-surface">
        <div className={`${SECTION} py-14`}>
          <div className="mb-9 text-center">
            <h2 className="text-section font-extrabold tracking-tight text-foreground">
              Как это работает
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step, index) => (
              <StepCard key={step.title} step={index + 1}>
                <span className="block font-bold">{step.title}</span>
                <span className="block text-muted-foreground">{step.body}</span>
              </StepCard>
            ))}
          </div>
        </div>
      </section>

      <HomepageInventoryClassic destinations={destinations} guides={guides} reviews={reviews} />

      <SiteFooter />
    </>
  );
}
