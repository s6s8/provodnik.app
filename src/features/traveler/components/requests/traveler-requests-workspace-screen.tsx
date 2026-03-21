"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listOpenRequests } from "@/data/open-requests/local-store";
import type { OpenRequestRecord } from "@/data/open-requests/types";
import { listTravelerBookings } from "@/data/traveler-booking/local-store";
import type { TravelerBookingRecord } from "@/data/traveler-booking/types";
import {
  listOffersForTravelerRequest,
  listTravelerRequests,
} from "@/data/traveler-request/local-store";
import type {
  TravelerOffer,
  TravelerRequestRecord,
} from "@/data/traveler-request/types";
import { PublicRequestCard } from "@/features/requests/components/public/public-request-card";

export function TravelerRequestsWorkspaceScreen() {
  const [requests, setRequests] = React.useState<TravelerRequestRecord[]>([]);
  const [groupRecords, setGroupRecords] = React.useState<OpenRequestRecord[]>([]);
  const [offers, setOffers] = React.useState<Array<TravelerOffer & { requestId: string }>>([]);
  const [bookings, setBookings] = React.useState<TravelerBookingRecord[]>([]);

  React.useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const nextRequests = await listTravelerRequests();
        const allOpenRequests = await listOpenRequests();
        const joined = allOpenRequests.filter((item) => item.isJoined).map((item) => item.record);
        const nextOffers = nextRequests.flatMap((request) =>
          listOffersForTravelerRequest(request.id).map((offer) => ({
            ...offer,
            requestId: request.id,
          })),
        );
        const nextBookings = listTravelerBookings().filter(
          (booking) => booking.status === "confirmed" || booking.status === "in_progress" || booking.status === "completed",
        );

        if (!isMounted) return;

        setRequests(nextRequests);
        setGroupRecords(joined);
        setOffers(nextOffers);
        setBookings(nextBookings);
      } catch {
        if (!isMounted) return;
        setRequests([]);
        setGroupRecords([]);
        setOffers([]);
        setBookings([]);
      }
    }

    void load();

    function handleStorage(event: StorageEvent) {
      if (event.key?.startsWith("provodnik.traveler.open-requests.") ?? false) {
        void load();
      }
    }

    function handleFocus() {
      void load();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
      isMounted = false;
    };
  }, []);

  const stats = React.useMemo(
    () => [
      { label: "запросов", value: requests.length },
      { label: "групп", value: groupRecords.length },
      { label: "предложений", value: offers.length },
    ],
    [groupRecords.length, offers.length, requests.length],
  );

  return (
    <div className="space-y-8">
      <header className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-3">
            <p className="editorial-kicker">Кабинет путешественника</p>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Мой кабинет
              </h1>
              <div className="glass-panel flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5">
                <div
                  aria-hidden
                  className="flex size-8 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white"
                >
                  П
                </div>
                <p className="text-sm font-medium text-white">Путешественник</p>
              </div>
            </div>
          </div>
          <Button asChild>
            <Link href="/traveler/requests/new">Новый запрос</Link>
          </Button>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {stats.map((item) => (
            <div
              key={item.label}
              className="glass-panel rounded-full border border-white/10 px-4 py-2.5"
            >
              <p className="text-xs text-white/60">#{item.value}</p>
              <p className="text-sm font-medium text-white">{item.label}</p>
            </div>
          ))}
        </div>
      </header>

      <Tabs defaultValue="requests" className="w-full">
        <TabsList>
          <TabsTrigger value="requests">Мои запросы</TabsTrigger>
          <TabsTrigger value="groups">Группы</TabsTrigger>
          <TabsTrigger value="offers">Предложения гидов</TabsTrigger>
          <TabsTrigger value="bookings">Бронирования</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          {requests.length === 0 ? (
            <EmptyState
              title="У вас пока нет запросов"
              description="Создайте первый запрос и получите предложения от гидов."
              ctaHref="/traveler/requests/new"
              ctaLabel="Создать запрос"
            />
          ) : (
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {requests.map((request) => (
                <PublicRequestCard
                  key={request.id}
                  request={toOpenRequestCardModel(request)}
                />
              ))}
            </section>
          )}
        </TabsContent>

        <TabsContent value="groups" className="space-y-3">
          {groupRecords.length === 0 ? (
            <EmptyState
              title="Нет активных групп"
              description="Когда вы присоединитесь к группе, она появится здесь."
              ctaHref="/traveler/open-requests"
              ctaLabel="Открыть группы"
            />
          ) : (
            <div className="grid gap-3">
              {groupRecords.map((group) => (
                <Card key={group.id} className="glass-panel border-white/10 bg-transparent">
                  <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-white">{group.destinationLabel}</p>
                      <p className="text-sm text-white/65">{group.dateRangeLabel}</p>
                      <p className="text-sm text-white/70">
                        {group.group.sizeCurrent} из {group.group.sizeTarget} участников
                      </p>
                    </div>
                    <Badge className={groupStatusClassName(group.status)}>
                      {groupStatusLabel(group.status)}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="offers" className="space-y-3">
          {offers.length === 0 ? (
            <EmptyState
              title="Пока нет предложений от гидов"
              description="Новые отклики появятся здесь, когда гиды ответят на запрос."
            />
          ) : (
            <div className="grid gap-3">
              {offers.map((offer) => (
                <Card key={offer.id} className="glass-panel border-white/10 bg-transparent">
                  <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-white">{offer.guide.name}</p>
                      <p className="text-sm text-white/65">{getOfferTitle(offer)}</p>
                      <p className="text-sm font-medium text-white">{formatRub(offer.priceTotalRub)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" size="sm" variant="secondary">
                        <Check className="size-3.5" />
                        Принять
                      </Button>
                      <Button type="button" size="sm" variant="outline">
                        <X className="size-3.5" />
                        Отклонить
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookings" className="space-y-3">
          {bookings.length === 0 ? (
            <EmptyState
              title="Нет подтвержденных бронирований"
              description="Подтвержденные бронирования появятся в этом разделе."
            />
          ) : (
            <div className="grid gap-3">
              {bookings.map((booking) => (
                <Card key={booking.id} className="glass-panel border-white/10 bg-transparent">
                  <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-white">{booking.request.destination}</p>
                      <p className="text-sm text-white/65">
                        {booking.request.startDate} - {booking.request.endDate}
                      </p>
                      <p className="text-sm font-medium text-white">
                        {formatRub(sumRub(booking.payment.lineItems))}
                      </p>
                    </div>
                    <Badge className="bg-emerald-500/18 text-emerald-100">Подтверждено</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <Card className="glass-panel border-white/10 bg-transparent">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-white/70">{description}</p>
        {ctaHref && ctaLabel ? (
          <Button asChild size="sm">
            <Link href={ctaHref}>
              {ctaLabel}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function toOpenRequestCardModel(request: TravelerRequestRecord): OpenRequestRecord {
  return {
    id: request.id,
    status: "forming_group",
    visibility: "public",
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    travelerRequestId: request.id,
    group: {
      sizeTarget: Math.max(request.request.groupSize, 2),
      sizeCurrent: request.request.groupSize,
      openToMoreMembers: request.request.openToJoiningOthers,
    },
    destinationLabel: request.request.destination,
    dateRangeLabel: `${request.request.startDate} — ${request.request.endDate}`,
    budgetPerPersonRub: request.request.budgetPerPersonRub,
    highlights: request.request.notes ? [request.request.notes] : ["Запрос путешественника"],
  };
}

function groupStatusLabel(status: OpenRequestRecord["status"]) {
  if (status === "forming_group") return "Формируется";
  if (status === "matched") return "Идут переговоры";
  return "Подтверждено";
}

function groupStatusClassName(status: OpenRequestRecord["status"]) {
  if (status === "forming_group") return "bg-sky-500/18 text-sky-100";
  if (status === "matched") return "bg-amber-500/18 text-amber-100";
  return "bg-emerald-500/18 text-emerald-100";
}

function getOfferTitle(offer: TravelerOffer) {
  if (offer.highlights.length > 0) return offer.highlights[0];
  return `Тур на ${offer.durationDays} дн.`;
}

function sumRub(items: TravelerBookingRecord["payment"]["lineItems"]) {
  return items.reduce((sum, item) => sum + item.amountRub, 0);
}

function formatRub(amount: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(amount);
}

