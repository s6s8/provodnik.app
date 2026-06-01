"use client";

import * as React from "react";
import Link from "next/link";
import { Inbox } from "lucide-react";

import { getOpenRequests, type RequestRecord } from "@/data/supabase/queries";
import { formatGroupLine } from "@/data/requests-format";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatTimeRange } from "@/lib/dates";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { BidFormPanel } from "./bid-form-panel";
import { GuideInboxCardHeader } from "./guide-inbox-card-header";
import {
  filterInbox,
  getInboxTabCounts,
  isMatchedRequest,
  type GuideRequestsFilter,
  type GuideRequestsSortKey,
} from "./guide-requests-inbox-filter";
import { GuideOfferQaPanel } from "./guide-offer-qa-panel";

interface OffersByRequest {
  offeredIds: Set<string>;
  offerIdByRequestId: Map<string, string>;
}

async function fetchOfferedRequestIds(guideId: string): Promise<OffersByRequest> {
  const supabase = createSupabaseBrowserClient();
  const { data } = await supabase
    .from("guide_offers")
    .select("id, request_id")
    .eq("guide_id", guideId);
  if (!data) return { offeredIds: new Set(), offerIdByRequestId: new Map() };
  const offeredIds = new Set(data.map((row) => row.request_id as string));
  const offerIdByRequestId = new Map(
    data.map((row) => [row.request_id as string, row.id as string]),
  );
  return { offeredIds, offerIdByRequestId };
}

export function GuideRequestsInboxScreen() {
  const [items, setItems] = React.useState<RequestRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [offeredIds, setOfferedIds] = React.useState<Set<string>>(new Set());
  const [offerIdByRequestId, setOfferIdByRequestId] = React.useState<Map<string, string>>(new Map());
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
      const { offeredIds: ids, offerIdByRequestId: offerMap } = await fetchOfferedRequestIds(guideId);
      if (ignore) return;
      setOfferedIds(ids);
      setOfferIdByRequestId(offerMap);
    }

    async function loadGuideProfileForGuide(guideId: string) {
      const { data } = await supabase
        .from("guide_profiles")
        .select("specializations, base_city, verification_status")
        .eq("user_id", guideId)
        .maybeSingle();
      if (ignore) return;
      setSpecializations(Array.isArray(data?.specializations) ? data.specializations : []);
      setBaseCity(typeof data?.base_city === "string" && data.base_city.trim() !== "" ? data.base_city : null);
      setVerificationStatus(typeof data?.verification_status === "string" ? data.verification_status : null);
    }

    async function loadInitial() {
      try {
        const { data } = await getOpenRequests(supabase);
        if (!ignore && data) setItems(data);

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!ignore && session?.user?.id) {
          await loadOffersForGuide(session.user.id);
          await loadGuideProfileForGuide(session.user.id);
        }
      } catch (err) {
        console.warn("[inbox] initial load failed:", err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void loadInitial();

    const { data: authSub } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (ignore) return;
        if (session?.user?.id) {
          void (async () => {
            await loadOffersForGuide(session.user.id);
            await loadGuideProfileForGuide(session.user.id);
          })();
        }
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

  const panelRequest = panelRequestId
    ? items.find((i) => i.id === panelRequestId)
    : null;

  const tabs: Array<{ key: GuideRequestsFilter; label: string; count: number }> = [
    { key: "new", label: "Новые", count: newCount },
    { key: "my-offers", label: "Мои предложения", count: myOffersCount },
  ];

  const emptyText =
    filter === "new"
      ? "Новых запросов пока нет. Путешественники публикуют запросы каждый день."
      : filter === "my-offers"
        ? "У вас нет активных предложений."
        : "Принятых предложений пока нет.";

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle>Входящие запросы</CardTitle>
          {!isLoading && (
            <p className="text-sm text-muted-foreground">
              {items.length} запрос
              {items.length === 1
                ? ""
                : items.length > 1 && items.length < 5
                  ? "а"
                  : "ов"}
              .
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Загрузка запросов…</p>
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
                          ? "inline-flex items-center gap-2 rounded-full border border-transparent bg-foreground px-4 py-2 text-sm font-medium text-background transition"
                          : "inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-background"
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
                      className="rounded-lg border border-border bg-surface-high px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary"
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
                    className="rounded-lg border border-border bg-surface-high px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary"
                    aria-label="Сортировка"
                  >
                    <option value="newest">Новые сначала</option>
                    <option value="date">По дате запроса</option>
                    <option value="size">По размеру группы</option>
                  </select>
                </div>
              ) : null}

              <div className="space-y-3">
                {filteredItems.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground">
                    {emptyText}
                  </p>
                ) : null}
                {filteredItems.map((item, index) => {
                  const alreadyOffered = offeredIds.has(item.id);
                  const matched = isMatchedRequest(item, specializations);
                  const offerId = offerIdByRequestId.get(item.id);
                  const showQaPanel = alreadyOffered && !!offerId;
                  return (
                    <div key={item.id} className="space-y-3">
                      <div className="rounded-xl border border-border/70 bg-background/60 p-4 transition hover:border-primary/40">
                        {/* Card header */}
                        <GuideInboxCardHeader item={item} matched={matched} />

                        <p className="mt-2 text-sm text-muted-foreground">{formatGroupLine(item)}</p>
                        {item.mode === "assembly" && (
                          <p className="mt-0.5 text-xs font-medium text-primary">Открытая группа — набор продолжается</p>
                        )}

                        {/* Meta */}
                        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                          <p>
                            <span className="font-medium text-foreground">
                              Даты:
                            </span>{" "}
                            {item.dateLabel}
                            {item.date_locked === false && (
                              <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                                гибкие даты
                              </span>
                            )}
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
                            {item.budgetLabel}
                          </p>
                        </div>

                        {item.description ? (
                          <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        ) : null}

                        {/* Actions */}
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          {alreadyOffered ? (
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-primary/10 px-3.5 py-1.5 font-sans text-xs font-semibold tracking-[0.02em] text-primary">
                              ✓ Предложение отправлено
                            </span>
                          ) : isApproved ? (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => setPanelRequestId(item.id)}
                            >
                              Сделать предложение
                            </Button>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2">
                              <Button variant="default" size="sm" disabled>
                                Доступно после верификации
                              </Button>
                              <Link
                                href="/guide/verification"
                                className="text-xs text-primary underline-offset-2 hover:underline"
                              >
                                Пройти верификацию →
                              </Link>
                            </div>
                          )}
                          <Link
                            href={`/guide/inbox/${item.id}`}
                            className="ml-auto text-sm font-medium text-primary underline-offset-2 hover:underline"
                            aria-label={`Открыть полный запрос: ${item.destination}`}
                          >
                            Подробнее →
                          </Link>
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
            // Mark as offered optimistically
            setOfferedIds((prev) => new Set([...prev, panelRequestId]));
          }}
        />
      ) : null}
    </div>
  );
}
