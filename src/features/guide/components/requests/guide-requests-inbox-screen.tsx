"use client";

import * as React from "react";
import Link from "next/link";
import { Inbox } from "lucide-react";

import { type RequestRecord, type BookingRecord, getGuideBookings } from "@/data/supabase/queries";
import { loadGuideInboxRequests } from "@/app/(protected)/guide/inbox/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatTimeRange } from "@/lib/dates";
import { COPY } from "@/lib/copy";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { BidFormPanel } from "./bid-form-panel-lazy";
import { GuideInboxCardHeader } from "./guide-inbox-card-header";
import {
  filterInbox,
  getInboxTabCounts,
  isMatchedRequest,
  type GuideRequestsFilter,
  type GuideRequestsSortKey,
} from "./guide-requests-inbox-filter";
import { GuideOfferQaPanel } from "./guide-offer-qa-panel";
import type { OfferMeta } from "./offer-meta";

interface OffersByRequest {
  offeredIds: Set<string>;
  offerIdByRequestId: Map<string, OfferMeta>;
  error?: string | null;
}

const LOAD_ERROR_MESSAGE = "Не удалось загрузить запросы. Попробуйте обновить страницу.";

async function fetchOfferedRequestIds(guideId: string): Promise<OffersByRequest> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("guide_offers")
    .select("id, request_id, starts_at, capacity, price_minor")
    .eq("guide_id", guideId);
  if (error || !data) {
    return { offeredIds: new Set(), offerIdByRequestId: new Map(), error: error?.message ?? null };
  }
  const offeredIds = new Set(data.map((row) => row.request_id as string));
  const offerIdByRequestId = new Map(
    data.map((row) => [
      row.request_id as string,
      {
        id: row.id as string,
        starts_at: (row.starts_at as string | null) ?? null,
        capacity: (row.capacity as number | null) ?? null,
        price_minor: (row.price_minor as number | null) ?? null,
      },
    ]),
  );
  return { offeredIds, offerIdByRequestId, error: null };
}

export function GuideRequestsInboxScreen() {
  const [items, setItems] = React.useState<RequestRecord[]>([]);
  const [bookings, setBookings] = React.useState<BookingRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [offeredIds, setOfferedIds] = React.useState<Set<string>>(new Set());
  const [offerIdByRequestId, setOfferIdByRequestId] = React.useState<Map<string, OfferMeta>>(new Map());
  const [guideId, setGuideId] = React.useState<string | null>(null);
  const [panelRequestId, setPanelRequestId] = React.useState<string | null>(
    null,
  );
  const [filter, setFilter] = React.useState<GuideRequestsFilter>("new");
  const [didAutoSelect, setDidAutoSelect] = React.useState(false);
  const [cityFilter, setCityFilter] = React.useState<string>("all");
  const [sortKey, setSortKey] = React.useState<GuideRequestsSortKey>(
    "newest",
  );
  const [specializations, setSpecializations] = React.useState<string[]>([]);
  const [baseCity, setBaseCity] = React.useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = React.useState<string | null>(null);
  const isApproved = verificationStatus === "approved";

  React.useEffect(() => {
    let ignore = false;
    const supabase = createSupabaseBrowserClient();

    async function loadOffersForGuide(guideId: string) {
      const { offeredIds: ids, offerIdByRequestId: offerMap, error } = await fetchOfferedRequestIds(guideId);
      if (ignore) return;
      if (error) setLoadError(LOAD_ERROR_MESSAGE);
      setOfferedIds(ids);
      setOfferIdByRequestId(offerMap);
    }

    async function loadGuideProfileForGuide(guideId: string) {
      const { data, error } = await supabase
        .from("guide_profiles")
        .select("specializations, base_city, verification_status")
        .eq("user_id", guideId)
        .maybeSingle();
      if (ignore) return;
      if (error) setLoadError(LOAD_ERROR_MESSAGE);
      setSpecializations(Array.isArray(data?.specializations) ? data.specializations : []);
      setBaseCity(typeof data?.base_city === "string" && data.base_city.trim() !== "" ? data.base_city : null);
      setVerificationStatus(typeof data?.verification_status === "string" ? data.verification_status : null);
    }

    async function loadInitial() {
      try {
        const { data, error } = await loadGuideInboxRequests();
        if (!ignore && error) setLoadError(LOAD_ERROR_MESSAGE);
        if (!ignore && data) setItems(data);

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!ignore && user?.id) {
          setGuideId(user.id);
          await loadOffersForGuide(user.id);
          await loadGuideProfileForGuide(user.id);
          const { data: bookingData } = await getGuideBookings(supabase, user.id);
          if (!ignore && bookingData) setBookings(bookingData);
        }
      } catch (err) {
        if (!ignore) setLoadError(LOAD_ERROR_MESSAGE);
        console.warn("[inbox] initial load failed:", err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void loadInitial();

    const { data: authSub } = supabase.auth.onAuthStateChange(
      () => {
        if (ignore) return;
        void (async () => {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (ignore || !user?.id) return;
          await loadOffersForGuide(user.id);
          await loadGuideProfileForGuide(user.id);
        })();
      },
    );

    return () => {
      ignore = true;
      authSub.subscription.unsubscribe();
    };
  }, []);

  const uniqueCities = React.useMemo(() => {
    const cities = items
      .map((item) => item.destination.split(",")[0].trim())
      .filter(Boolean);
    return [...new Set(cities)].sort();
  }, [items]);

  const { newCount, myOffersCount } = React.useMemo(
    () =>
      getInboxTabCounts(items, {
        baseCity,
        cityFilter,
        offeredIds,
        sortKey,
        specializations,
      }),
    [items, offeredIds, baseCity, cityFilter, sortKey, specializations],
  );

  React.useEffect(() => {
    if (didAutoSelect) return;
    if (isLoading) return;
    if (items.length === 0) return;
    if (newCount === 0 && myOffersCount > 0) {
      setFilter("my-offers");
    }
    setDidAutoSelect(true);
  }, [didAutoSelect, isLoading, items.length, newCount, myOffersCount]);

  const filteredItems = React.useMemo(() => {
    return filterInbox(items, {
      baseCity,
      cityFilter,
      filter,
      offeredIds,
      sortKey,
      specializations,
    });
  }, [filter, items, offeredIds, baseCity, cityFilter, sortKey, specializations]);

  const activeBookings = React.useMemo(
    () => bookings.filter((b) => b.status !== "cancelled" && b.status !== "no_show" && b.status !== "completed"),
    [bookings],
  );

  const panelRequest = panelRequestId
    ? items.find((i) => i.id === panelRequestId)
    : null;

  const tabs: Array<{ key: GuideRequestsFilter; label: string; count: number }> = [
    { key: "new", label: "Новые", count: newCount },
    { key: "my-offers", label: "Мои отклики", count: myOffersCount },
    { key: "confirmed", label: "Подтверждённые", count: activeBookings.length },
  ];

  const emptyText =
    filter === "new"
      ? "Новых запросов пока нет. Путешественники публикуют запросы каждый день."
      : filter === "my-offers"
      ? "У вас нет активных предложений."
      : "Подтверждённых бронирований пока нет.";

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={COPY.guide} title="Входящие запросы" />
      <Card className="border-border/70 bg-card/90">
        <CardContent className="space-y-4 pt-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Загрузка запросов…</p>
          ) : loadError ? (
            <Alert variant="destructive">
              <AlertDescription>{loadError}</AlertDescription>
            </Alert>
          ) : items.length === 0 ? (
            <EmptyState
              icon={<Inbox className="size-7" strokeWidth={1.5} />}
              title="Запросов пока нет"
              description="Путешественники публикуют новые запросы каждый день — скоро здесь появятся подходящие заявки."
            />
          ) : (
            <>
              <div
                role="tablist"
                aria-label="Фильтр запросов"
                className="flex flex-wrap gap-2"
              >
                {tabs.map((tab) => {
                  const isSelected = filter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() => setFilter(tab.key)}
                      className={
                        isSelected
                          ? "inline-flex min-h-[44px] items-center gap-2 rounded-full border border-transparent bg-foreground px-4 py-2 text-sm font-medium text-background transition"
                          : "inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-background"
                      }
                    >
                      <span>{tab.label}</span>
                      <span
                        className={
                          isSelected
                            ? "rounded-full bg-background/20 px-2 py-0.5 text-xs tabular-nums"
                            : "rounded-full bg-muted/40 px-2 py-0.5 text-xs tabular-nums"
                        }
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
              {/* City filter + sort */}
              {items.length > 0 ? (
                <div className="flex flex-wrap items-center gap-3">
                  {uniqueCities.length > 1 ? (
                    <select
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                      className="min-h-[44px] rounded-lg border border-border bg-surface-high px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary"
                      aria-label="Фильтр по городу"
                    >
                      <option value="all">Все направления</option>
                      {uniqueCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  <select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
                    className="min-h-[44px] rounded-lg border border-border bg-surface-high px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary"
                    aria-label="Сортировка"
                  >
                    <option value="newest">Новые сначала</option>
                    <option value="date">По дате запроса</option>
                    <option value="size">По размеру группы</option>
                  </select>
                </div>
              ) : null}

              <div className="space-y-3">
                {filter === "confirmed" ? (
                  activeBookings.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground">{emptyText}</p>
                  ) : (
                    activeBookings.map((booking) => (
                      <Link
                        key={booking.id}
                        href={`/guide/bookings/${booking.id}`}
                        className="block rounded-xl border border-border/70 bg-background/60 p-4 transition hover:border-primary/40"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">{booking.destination}</p>
                            <p className="text-xs text-muted-foreground">{booking.dateLabel}</p>
                          </div>
                          <Badge variant="secondary">Подтверждено</Badge>
                        </div>
                        {booking.priceRub > 0 ? (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {booking.priceRub.toLocaleString("ru-RU")} ₽
                          </p>
                        ) : null}
                      </Link>
                    ))
                  )
                ) : null}
                {filter !== "confirmed" && filteredItems.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground">
                    {emptyText}
                  </p>
                ) : null}
                {filter !== "confirmed" && filteredItems.map((item, index) => {
                  const alreadyOffered = offeredIds.has(item.id);
                  const matched = isMatchedRequest(item, specializations);
                  const offerMeta = offerIdByRequestId.get(item.id);
                  const offerId = offerMeta?.id;
                  const showQaPanel = alreadyOffered && !!offerId;
                  const hasFlexibleDates = item.dateFlexibility === "few_days" || item.date_locked === false;
                  return (
                    <div key={item.id} className="space-y-3">
                      <div className="rounded-xl border border-border/70 bg-background/60 p-4 transition hover:border-primary/40">
                        {/* Card header */}
                        <GuideInboxCardHeader item={item} matched={matched} />

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge variant={item.mode === "assembly" ? "secondary" : "outline"}>
                            {item.mode === "assembly" ? "Сборная группа" : "Своя группа"}
                          </Badge>
                          <Badge variant={hasFlexibleDates ? "default" : "outline"}>
                            {hasFlexibleDates ? "Гибкие даты" : "Точная дата"}
                          </Badge>
                        </div>

                        {/* Meta */}
                        <div className="mt-3 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                          <p>
                            <span className="font-medium text-foreground">
                              Даты:
                            </span>{" "}
                            {item.dateLabel}
                            {formatTimeRange(item.startTime, item.endTime) && (
                              <>
                                {" · "}
                                <span className="font-medium text-foreground">Время:</span>{" "}
                                {formatTimeRange(item.startTime, item.endTime)}
                              </>
                            )}
                          </p>
                          <p>
                            <span className="font-medium text-foreground">
                              Бюджет:
                            </span>{" "}
                            {item.budgetLabel} · {item.groupSize} чел.
                          </p>
                        </div>


                        {/* Actions */}
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          {alreadyOffered ? (
                            <div className="flex flex-col gap-2">
                              <Badge variant="secondary">Предложение отправлено</Badge>
                              {offerMeta && (offerMeta.starts_at != null || offerMeta.capacity != null || offerMeta.price_minor != null) ? (
                                <p className="text-xs leading-relaxed text-muted-foreground">
                                  Вы предложили:
                                  {offerMeta.starts_at ? ` ${new Date(offerMeta.starts_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}` : ""}
                                  {offerMeta.capacity != null ? ` · ${offerMeta.capacity} чел.` : ""}
                                  {offerMeta.price_minor != null ? ` · ${Math.round(offerMeta.price_minor / 100 / (offerMeta.capacity ?? 1)).toLocaleString("ru-RU")} ₽/чел.` : ""}
                                </p>
                              ) : null}
                            </div>
                          ) : isApproved ? (
                            <Button onClick={() => setPanelRequestId(item.id)}>
                              Сделать предложение
                            </Button>
                          ) : (
                            <Button variant="outline" asChild>
                              <Link href="/guide/profile#verification">Пройти верификацию</Link>
                            </Button>
                          )}
                          <Button variant="ghost" asChild className="ml-auto min-h-[44px]">
                            <Link
                              href={`/requests/${item.id}`}
                              aria-label={`Открыть полный запрос: ${item.destination}`}
                            >
                              Подробнее
                            </Link>
                          </Button>
                        </div>

                        {/* Q&A panel — shown when guide has sent an offer */}
                        {showQaPanel ? (
                          <div className="mt-4 pt-4 border-t border-border/50">
                              <GuideOfferQaPanel key={offerId} offerId={offerId} />
                          </div>
                        ) : null}
                      </div>

                      {index < filteredItems.length - 1 ? <Separator /> : null}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {panelRequestId && panelRequest ? (
        <BidFormPanel
          requestId={panelRequestId}
          request={panelRequest}
          onClose={() => setPanelRequestId(null)}
          onSuccess={() => {
            setOfferedIds((prev) => new Set([...prev, panelRequestId]));
            if (guideId) {
              void fetchOfferedRequestIds(guideId).then(({ offeredIds: ids, offerIdByRequestId: offerMap }) => {
                setOfferedIds(ids);
                setOfferIdByRequestId(offerMap);
              });
            }
          }}
        />
      ) : null}
    </div>
  );
}
