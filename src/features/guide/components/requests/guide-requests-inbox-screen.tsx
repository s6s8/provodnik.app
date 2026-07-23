"use client";

import * as React from "react";
import Link from "next/link";
import { Inbox } from "lucide-react";

import { isFlexibleDateFlexibility } from "@/data/request-date-flexibility";
import { type RequestRecord } from "@/data/supabase/queries";
import { kopecksToRub, formatRubNumber } from "@/data/money";
import { loadGuideInboxRequests } from "@/app/(protected)/guide/inbox/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatTimeRange } from "@/lib/dates";
import {
  canSeeRequestParticipantCount,
  formatGuideInboxBudgetLine,
} from "@/lib/supabase/request-participant-visibility";

import { EmptyState } from "@/components/shared/empty-state";
import { ListRowSkeleton } from "@/components/shared/loading-skeletons";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { BidFormPanel } from "./bid-form-panel-lazy";
import { GuideInboxCardHeader } from "./guide-inbox-card-header";
import {
  filterInbox,
  getInboxTabCounts,
  isMatchedRequest,
  type GuideRequestsFilter,
  type GuideRequestsSortKey,
  type GuideRequestsTypeFilter,
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
    .select("id, request_id, starts_at, capacity, price_minor, status")
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
        status: (row.status as OfferMeta["status"]) ?? undefined,
      },
    ]),
  );
  return { offeredIds, offerIdByRequestId, error: null };
}

export function GuideRequestsInboxScreen() {
  const [items, setItems] = React.useState<RequestRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [peripheralWarning, setPeripheralWarning] = React.useState<string | null>(null);
  const [offeredIds, setOfferedIds] = React.useState<Set<string>>(new Set());
  const [offerIdByRequestId, setOfferIdByRequestId] = React.useState<Map<string, OfferMeta>>(new Map());
  const [guideId, setGuideId] = React.useState<string | null>(null);
  const [panelRequestId, setPanelRequestId] = React.useState<string | null>(
    null,
  );
  const [filter, setFilter] = React.useState<GuideRequestsFilter>("new");
  const [didAutoSelect, setDidAutoSelect] = React.useState(false);
  const [cityFilter, setCityFilter] = React.useState<string>("all");
  const [requestTypeFilter, setRequestTypeFilter] = React.useState<GuideRequestsTypeFilter>("all");
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
      if (error) setPeripheralWarning("Запросы загружены, но часть данных по откликам временно недоступна.");
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
      if (error) setPeripheralWarning("Запросы загружены, но часть данных по откликам временно недоступна.");
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
        requestTypeFilter,
        sortKey,
        specializations,
      }),
    [items, offeredIds, baseCity, cityFilter, requestTypeFilter, sortKey, specializations],
  );

  React.useEffect(() => {
    if (didAutoSelect) return;
    if (isLoading) return;
    if (items.length === 0) return;
    const timer = window.setTimeout(() => {
      if (newCount === 0 && myOffersCount > 0) {
        setFilter("my-offers");
      }
      setDidAutoSelect(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [didAutoSelect, isLoading, items.length, newCount, myOffersCount]);

  const filteredItems = React.useMemo(() => {
    return filterInbox(items, {
      baseCity,
      cityFilter,
      filter,
      offeredIds,
      requestTypeFilter,
      sortKey,
      specializations,
    });
  }, [filter, items, offeredIds, baseCity, cityFilter, requestTypeFilter, sortKey, specializations]);

  const panelRequest = panelRequestId
    ? items.find((i) => i.id === panelRequestId)
    : null;

  const tabs: Array<{ key: GuideRequestsFilter; label: string; count: number }> = [
    { key: "new", label: "Новые", count: newCount },
    { key: "my-offers", label: "Мои отклики", count: myOffersCount },
  ];

  const emptyText =
    filter === "new"
      ? "Новых запросов пока нет. Путешественники публикуют запросы каждый день."
      : "У вас нет активных предложений.";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Кабинет гида" title="Входящие запросы" />
      <Card className="border-border/70 bg-card/90">
        <CardContent className="flex flex-col gap-4 pt-6">
          {isLoading ? (
            <div className="flex flex-col gap-3" aria-busy="true" aria-label="Загрузка запросов">
              {Array.from({ length: 3 }).map((_, i) => (
                <ListRowSkeleton key={i} />
              ))}
            </div>
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
              {peripheralWarning ? (
                <Alert>
                  <AlertDescription>{peripheralWarning}</AlertDescription>
                </Alert>
              ) : null}
              <Tabs
                value={filter}
                onValueChange={(next) => setFilter(next as GuideRequestsFilter)}
                className="flex flex-col gap-4"
              >
                <TabsList aria-label="Фильтр запросов">
                  {tabs.map((tab) => (
                    <TabsTrigger
                      key={tab.key}
                      value={tab.key}
                      className="group gap-2"
                    >
                      <span>{tab.label}</span>
                      <span className="rounded-full bg-muted/40 px-2 py-0.5 text-xs tabular-nums group-data-[state=active]:bg-primary-foreground/20">
                        {tab.count}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* City filter + sort */}
                {items.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-3">
                    {uniqueCities.length > 1 ? (
                      <Select value={cityFilter} onValueChange={setCityFilter}>
                        <SelectTrigger className="min-h-11" aria-label="Фильтр по городу">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Все направления</SelectItem>
                          {uniqueCities.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : null}
                    <Select
                      value={sortKey}
                      onValueChange={(next) => setSortKey(next as GuideRequestsSortKey)}
                    >
                      <SelectTrigger className="min-h-11" aria-label="Сортировка">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Новые сначала</SelectItem>
                        <SelectItem value="date">По дате запроса</SelectItem>
                        <SelectItem value="size">По размеру группы</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={requestTypeFilter}
                      onValueChange={(next) => setRequestTypeFilter(next as GuideRequestsTypeFilter)}
                    >
                      <SelectTrigger className="min-h-11" aria-label="Фильтр по типу запроса">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все типы</SelectItem>
                        <SelectItem value="assembly">Сборная группа</SelectItem>
                        <SelectItem value="private">Своя группа</SelectItem>
                        <SelectItem value="direct">Запрос на ваше имя</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}

                {/* One panel: both filters render the same list, only the items differ. */}
                <TabsContent value={filter} className="mt-0 flex flex-col gap-3">
                  {filteredItems.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground">
                      {emptyText}
                    </p>
                  ) : null}
                  {filteredItems.map((item, index) => {
                    const alreadyOffered = offeredIds.has(item.id);
                    const matched = isMatchedRequest(item, specializations);
                    const offerMeta = offerIdByRequestId.get(item.id);
                    const offerId = offerMeta?.id;
                    const offerStatus = offerMeta?.status ?? "pending";
                    const isDeclinedOffer = offerStatus === "declined";
                    const showQaPanel = alreadyOffered && !!offerId && !isDeclinedOffer;
                    const hasFlexibleDates = isFlexibleDateFlexibility(item.dateFlexibility);
                    const canSeeParticipants = canSeeRequestParticipantCount(item, {
                      kind: "guide",
                      hasSubmittedOffer: alreadyOffered,
                      isAddressedGuide: item.isDirectToViewer === true,
                    });
                    return (
                      <div key={item.id} className="flex flex-col gap-3">
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
                            {hasFlexibleDates ? (
                              <Badge variant="default">Гибкое время</Badge>
                            ) : null}
                          </div>

                          {/* Meta */}
                          <div className="mt-3 flex flex-col gap-1.5 text-xs leading-relaxed text-muted-foreground">
                            <p>
                              <span className="font-medium text-foreground">
                                Даты:
                              </span>{" "}
                              {item.dateLabel}
                              {hasFlexibleDates ? (
                                <>
                                  {" · "}
                                  <span className="font-medium text-foreground">Время:</span>{" "}
                                  гибкое
                                </>
                              ) : formatTimeRange(item.startTime, item.endTime) ? (
                                <>
                                  {" · "}
                                  <span className="font-medium text-foreground">Время:</span>{" "}
                                  {formatTimeRange(item.startTime, item.endTime)}
                                </>
                              ) : null}
                            </p>
                            <p>
                              <span className="font-medium text-foreground">
                                Бюджет:
                              </span>{" "}
                              {formatGuideInboxBudgetLine(item, canSeeParticipants)}
                            </p>
                          </div>


                          {/* Actions */}
                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            {alreadyOffered ? (
                              <div className="flex flex-col gap-2">
                                <Badge variant={isDeclinedOffer ? "destructive" : "secondary"}>
                                  {isDeclinedOffer ? "Отклонено автором" : "Предложение отправлено"}
                                </Badge>
                                {offerMeta && (offerMeta.starts_at != null || offerMeta.capacity != null || offerMeta.price_minor != null) ? (
                                  <p className="text-xs leading-relaxed text-muted-foreground">
                                    Вы предложили:
                                    {offerMeta.starts_at ? ` ${new Date(offerMeta.starts_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}` : ""}
                                    {offerMeta.capacity != null ? ` · ${offerMeta.capacity} чел.` : ""}
                                    {offerMeta.price_minor != null ? ` · ${formatRubNumber(Math.round(kopecksToRub(offerMeta.price_minor) / (offerMeta.capacity ?? 1)))} ₽/чел.` : ""}
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
                            <Button variant="ghost" asChild className="ml-auto">
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
                </TabsContent>
              </Tabs>
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
