"use client";

import * as React from "react";
import Link from "next/link";

import { getOpenRequests, type RequestRecord } from "@/data/supabase/queries";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { BidFormPanel } from "./bid-form-panel";
import { GuideOfferQaPanel } from "./guide-offer-qa-panel";

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

type RequestsFilter = "new" | "my-offers" | "accepted";

export function GuideRequestsInboxScreen() {
  const [items, setItems] = React.useState<RequestRecord[]>([]);
  const [offeredIds, setOfferedIds] = React.useState<Set<string>>(new Set());
  const [offerIdByRequestId, setOfferIdByRequestId] = React.useState<Map<string, string>>(new Map());
  const [acceptedOfferIds, setAcceptedOfferIds] = React.useState<Set<string>>(
    new Set(),
  );
  const [panelRequestId, setPanelRequestId] = React.useState<string | null>(
    null,
  );
  const [filter, setFilter] = React.useState<RequestsFilter>("new");
  const [didAutoSelect, setDidAutoSelect] = React.useState(false);
  const [cityFilter, setCityFilter] = React.useState<string>("all");
  const [sortKey, setSortKey] = React.useState<"newest" | "date" | "size">(
    "newest",
  );

  React.useEffect(() => {
    let ignore = false;
    const supabase = createSupabaseBrowserClient();

    async function loadOffersForGuide(guideId: string) {
      const { offeredIds: ids, offerIdByRequestId: offerMap } = await fetchOfferedRequestIds(guideId);
      if (ignore) return;
      setOfferedIds(ids);
      setOfferIdByRequestId(offerMap);

      const { data: acceptedOffers, error } = await supabase
        .from("guide_offers")
        .select("request_id")
        .eq("guide_id", guideId)
        .eq("status", "accepted");
      if (ignore) return;
      if (error) {
        console.warn("[inbox] failed to load accepted offers:", error.message);
        return;
      }
      if (acceptedOffers) {
        setAcceptedOfferIds(
          new Set(acceptedOffers.map((o) => o.request_id as string)),
        );
      }
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
        }
      } catch (err) {
        console.warn("[inbox] initial load failed:", err);
      }
    }

    void loadInitial();

    const { data: authSub } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (ignore) return;
        if (session?.user?.id) void loadOffersForGuide(session.user.id);
      },
    );

    return () => {
      ignore = true;
      authSub.subscription.unsubscribe();
    };
  }, []);

  const summary = {
    total: items.length,
    highBudget: items.filter((item) => item.budgetRub >= 15000).length,
  };

  const uniqueCities = React.useMemo(() => {
    const cities = items
      .map((item) => item.destination.split(",")[0].trim())
      .filter(Boolean);
    return [...new Set(cities)].sort();
  }, [items]);

  const newCount = items.filter(
    (item) => !offeredIds.has(item.id) && !acceptedOfferIds.has(item.id),
  ).length;
  const myOffersCount = items.filter(
    (item) => offeredIds.has(item.id) && !acceptedOfferIds.has(item.id),
  ).length;

  React.useEffect(() => {
    if (didAutoSelect) return;
    if (items.length === 0) return;
    if (newCount === 0 && myOffersCount > 0) {
      setFilter("my-offers");
    }
    setDidAutoSelect(true);
  }, [didAutoSelect, items.length, newCount, myOffersCount]);

  const filteredItems = React.useMemo(() => {
    let filtered = items;

    // Tab filter
    if (filter === "new") {
      filtered = filtered.filter(
        (item) => !offeredIds.has(item.id) && !acceptedOfferIds.has(item.id),
      );
    } else if (filter === "my-offers") {
      filtered = filtered.filter(
        (item) => offeredIds.has(item.id) && !acceptedOfferIds.has(item.id),
      );
    } else if (filter === "accepted") {
      filtered = filtered.filter((item) => acceptedOfferIds.has(item.id));
    }

    // City filter
    if (cityFilter !== "all") {
      filtered = filtered.filter(
        (item) => item.destination.split(",")[0].trim() === cityFilter,
      );
    }

    // Sort
    if (sortKey === "newest") {
      filtered = [...filtered].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      );
    } else if (sortKey === "date") {
      filtered = [...filtered].sort((a, b) => a.dateLabel.localeCompare(b.dateLabel));
    } else if (sortKey === "size") {
      filtered = [...filtered].sort((a, b) => b.groupSize - a.groupSize);
    }

    return filtered;
  }, [filter, items, offeredIds, acceptedOfferIds, cityFilter, sortKey]);

  const panelRequest = panelRequestId
    ? items.find((i) => i.id === panelRequestId)
    : null;

  const tabs: Array<{ key: RequestsFilter; label: string; count: number }> = [
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
          <CardTitle>Сводка по запросам</CardTitle>
          <p className="text-sm text-muted-foreground">
            Сколько запросов сейчас в очереди и сколько из них с высоким
            бюджетом.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border/70 bg-background/60 p-3">
            <p className="text-xs text-muted-foreground">Всего запросов</p>
            <p className="mt-1 text-base font-semibold text-foreground">
              {summary.total}
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-background/60 p-3">
            <p className="text-xs text-muted-foreground">Бюджет от 15 000 ₽</p>
            <p className="mt-1 text-base font-semibold text-foreground">
              {summary.highBudget}
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-background/60 p-3">
            <p className="text-xs text-muted-foreground">Готовы к разбору</p>
            <p className="mt-1 text-base font-semibold text-foreground">
              {summary.total}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle>Входящие запросы</CardTitle>
          <p className="text-sm text-muted-foreground">
            {items.length} запрос
            {items.length === 1
              ? ""
              : items.length > 1 && items.length < 5
                ? "а"
                : "ов"}
            .
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {emptyText}
            </p>
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
                      <option value="all">Все города</option>
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
                    <option value="date">По дате поездки</option>
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
                  const offerId = offerIdByRequestId.get(item.id);
                  const showQaPanel = (alreadyOffered || acceptedOfferIds.has(item.id)) && !!offerId;
                  return (
                    <div key={item.id} className="space-y-3">
                      <div className="rounded-xl border border-border/70 bg-background/60 p-4">
                        {/* Card header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-foreground">
                              {item.requesterName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {item.format} в{" "}
                              <span className="font-medium text-foreground">
                                {item.destination}
                              </span>
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground shrink-0">
                            {formatDateTime(item.createdAt)}
                          </p>
                        </div>

                        {/* Meta */}
                        <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                          <p>
                            <span className="font-medium text-foreground">
                              Даты:
                            </span>{" "}
                            {item.dateLabel}
                            {item.startTime ? ` · ${item.startTime}${item.endTime ? `–${item.endTime}` : ""}` : ""}
                          </p>
                          <p>
                            <span className="font-medium text-foreground">
                              Группа:
                            </span>{" "}
                            {item.groupSize} чел.
                          </p>
                          <p className="sm:col-span-2">
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
                          {acceptedOfferIds.has(item.id) ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3.5 py-1.5 text-xs font-semibold text-green-700">
                              ✓ Предложение принято
                            </span>
                          ) : alreadyOffered ? (
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-primary/10 px-3.5 py-1.5 font-sans text-xs font-semibold tracking-[0.02em] text-primary">
                              ✓ Предложение отправлено
                            </span>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => setPanelRequestId(item.id)}
                            >
                              Предложить цену
                            </Button>
                          )}
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="px-3"
                          >
                            <Link href={`/guide/inbox/${item.id}`}>
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
            // Mark as offered optimistically
            setPanelRequestId(null);
            setOfferedIds((prev) => new Set([...prev, panelRequestId]));
          }}
        />
      ) : null}
    </div>
  );
}
