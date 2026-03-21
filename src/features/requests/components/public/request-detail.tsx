import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Star, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PriceScenarioCard } from "./price-scenario-card";
import type { OpenRequestRecord } from "@/data/open-requests/types";
import { listSeededRosterForOpenRequest } from "@/data/open-requests/seed";
import { listOffersForTravelerRequest } from "@/data/traveler-request/local-store";

function formatRub(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function getCityRegionLabel(request: OpenRequestRecord) {
  const destination = request.destinationLabel?.trim() ?? "";
  const city = destination.split(",")[0]?.trim() ?? destination;

  if (request.regionLabel?.trim()) {
    return `${city}, ${request.regionLabel.trim()}`;
  }

  return destination;
}

function getInitials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "У";
  const parts = trimmed.split(/\s+/g).filter(Boolean);
  const letters = parts
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  return letters.toUpperCase();
}

function getStatusLabel(status: OpenRequestRecord["status"]) {
  switch (status) {
    case "open":
      return "Открыт";
    case "forming_group":
      return "Формируется";
    case "matched":
      return "Согласован";
    case "closed":
      return "Закрыт";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

function uniqByGroupSize(
  items: Array<{ groupSize: number; pricePerPersonRub: number }>,
) {
  const map = new Map<number, { groupSize: number; pricePerPersonRub: number }>();
  for (const item of items) {
    map.set(item.groupSize, item);
  }
  return [...map.values()];
}

function computePriceScenarios({
  request,
  offers,
}: {
  request: OpenRequestRecord;
  offers: Array<ReturnType<typeof listOffersForTravelerRequest>[number]>;
}): Array<{ groupSize: number; pricePerPersonRub: number }> {
  if (request.priceScenarios?.length) return request.priceScenarios;

  const baseTotalRub =
    offers[0]?.priceTotalRub ??
    (typeof request.budgetPerPersonRub === "number" &&
    request.group.sizeCurrent > 0
      ? request.budgetPerPersonRub * request.group.sizeCurrent
      : 0);

  const sizeTarget = Math.max(1, request.group.sizeTarget);
  const sizeCurrent = Math.max(1, request.group.sizeCurrent);

  // Risk scenario: group shrinks from target down by 0..3, plus current (highlight).
  const rawVariants = [sizeTarget, sizeTarget - 1, sizeTarget - 2, sizeTarget - 3, sizeCurrent]
    .filter((n) => n >= 1);

  const variants = uniqByGroupSize(
    rawVariants.map((groupSize) => ({
      groupSize,
      pricePerPersonRub:
        baseTotalRub > 0 ? Math.round(baseTotalRub / groupSize) : 0,
    })),
  ).sort((a, b) => b.groupSize - a.groupSize);

  return variants;
}

export function RequestDetailScreen({ request }: { request: OpenRequestRecord }) {
  const roster = listSeededRosterForOpenRequest(request.id);
  const offers = listOffersForTravelerRequest(request.travelerRequestId);

  const destinationLabel = getCityRegionLabel(request);
  const currentGroupSize = Math.max(1, request.group.sizeCurrent);
  const statusLabel = getStatusLabel(request.status);

  const avatarMembers = roster.slice(
    0,
    Math.max(1, Math.min(5, request.group.sizeCurrent)),
  );

  const pct =
    request.group.sizeTarget > 0
      ? (request.group.sizeCurrent / request.group.sizeTarget) * 100
      : 0;

  const scenarios = computePriceScenarios({ request, offers });

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-8">
        <main className="space-y-6 lg:space-y-8">
          {/* 1) Hero */}
          <div className="relative min-h-[320px] overflow-hidden rounded-[2rem] border border-white/10 bg-black">
            <Image
              src={
                request.imageUrl ??
                "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=1600&h=1200&q=80"
              }
              alt={destinationLabel}
              fill
              sizes="(max-width: 1024px) 100vw, 65vw"
              className="object-cover"
              priority={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
                  <CalendarDays className="size-4" />
                  {request.dateRangeLabel}
                </div>
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                  {destinationLabel}
                </h1>
              </div>
            </div>
          </div>

          {/* 2) Request metadata glass card */}
          <Card className="border-white/10">
            <CardContent className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    {destinationLabel}
                  </h2>
                  <div className="inline-flex items-center gap-2 text-sm text-white/70">
                    <CalendarDays className="size-4" />
                    {request.dateRangeLabel}
                  </div>
                </div>
                <Badge variant="outline" className="rounded-full">
                  {statusLabel}
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">
                    Цель поездки
                  </p>
                  <p className="text-sm leading-6 text-white/80">
                    {destinationLabel}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">
                    Размер группы
                  </p>
                  <p className="text-sm leading-6 text-white/80">
                    Целевой размер: {request.group.sizeTarget} чел.
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">
                    Бюджет
                  </p>
                  <p className="text-sm leading-6 text-white/80">
                    {typeof request.budgetPerPersonRub === "number"
                      ? `~${formatRub(request.budgetPerPersonRub)} ₽ / чел.`
                      : "Бюджет уточняется"}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">
                    Статус
                  </p>
                  <p className="text-sm leading-6 text-white/80">{statusLabel}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3) Participants section */}
          <Card className="border-white/10">
            <CardContent className="space-y-5 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold tracking-tight text-foreground">
                    Участники группы
                  </h3>
                  <div className="inline-flex items-center gap-2 text-sm text-white/70">
                    <Users className="size-4" />
                    {request.group.sizeCurrent} из {request.group.sizeTarget} участников
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex -space-x-2">
                  {avatarMembers.map((m) => (
                    <div
                      key={m.id}
                      className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/15 text-[0.7rem] font-bold text-white"
                      aria-label={`Участник: ${m.displayName}`}
                    >
                      {getInitials(m.displayName)}
                    </div>
                  ))}
                </div>
                <div className="text-xs font-semibold text-white/60">
                  {Math.round(Math.max(0, Math.min(100, pct)))}%
                </div>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                />
              </div>

              <Button
                asChild
                variant="default"
                size="lg"
                className="w-full rounded-full"
              >
                <Link href={`/traveler/open-requests/${request.id}`}>
                  Присоединиться к группе
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* 4) Guide offers section (if any) */}
          {offers.length > 0 ? (
            <section className="space-y-5">
              <div className="flex items-end justify-between gap-3">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold tracking-tight text-foreground">
                    Предложения гидов
                  </h3>
                </div>
                <Badge variant="outline" className="rounded-full">
                  {offers.length} предложени{offers.length === 1 ? "е" : "я"}
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {offers.map((offer) => {
                  const guideInitials = getInitials(offer.guide.name);
                  const pricePerPerson =
                    currentGroupSize > 0
                      ? Math.round(offer.priceTotalRub / currentGroupSize)
                      : offer.priceTotalRub;

                  return (
                    <div
                      key={offer.id}
                      className="glass-panel rounded-[1.5rem] border border-white/10 p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/15 text-sm font-bold text-white">
                            {guideInitials}
                          </div>
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <p className="text-base font-semibold tracking-tight text-white">
                                {offer.guide.name}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-white/70">
                                <Star className="size-4 text-primary" />
                                <span>{offer.guide.rating.toFixed(1)}</span>
                                <span className="text-white/40">·</span>
                                <span>{offer.guide.homeBase}</span>
                              </div>
                            </div>
                            <p className="text-sm text-white/80">
                              Цена: ~{formatRub(pricePerPerson)} ₽ / чел.
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">
                            Итог
                          </p>
                          <p className="text-base font-semibold text-white">
                            {formatRub(offer.priceTotalRub)} ₽
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-2">
                        <div className="flex flex-wrap gap-2">
                          {offer.highlights.slice(0, 2).map((h) => (
                            <span
                              key={h}
                              className="inline-flex items-center rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-white/70"
                            >
                              {h}
                            </span>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Button variant="default" size="lg" className="rounded-full">
                            Принять
                          </Button>
                          <Button variant="outline" size="lg" className="rounded-full">
                            Встречная цена
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
        </main>

        {/* RIGHT COLUMN */}
        <aside className="space-y-6 lg:space-y-8">
          {/* 1) Price scenario card */}
          <PriceScenarioCard
            scenarios={scenarios}
            currentGroupSize={currentGroupSize}
          />

          {/* 2) Quick summary */}
          <Card className="border-white/10">
            <CardContent className="space-y-4 p-5">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  Кратко о запросе
                </h3>
                <p className="text-sm text-white/70">{destinationLabel}</p>
              </div>

              <div className="grid gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">
                    Даты
                  </p>
                  <p className="text-sm leading-6 text-white/80">{request.dateRangeLabel}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">
                    Бюджет на человека
                  </p>
                  <p className="text-sm leading-6 text-white/80">
                    {typeof request.budgetPerPersonRub === "number"
                      ? `~${formatRub(request.budgetPerPersonRub)} ₽`
                      : "Уточняется"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3) CTA */}
          <Button asChild variant="default" size="lg" className="w-full rounded-full">
            <Link href="/traveler/requests/new">Создать похожий запрос</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}

