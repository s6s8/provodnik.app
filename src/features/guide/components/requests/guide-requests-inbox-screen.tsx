"use client";

import * as React from "react";
import Link from "next/link";

import { getOpenRequests, type RequestRecord } from "@/data/supabase/queries";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { BidFormPanel } from "./bid-form-panel";

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

async function fetchOfferedRequestIds(guideId: string): Promise<Set<string>> {
  const supabase = createSupabaseBrowserClient();
  const { data } = await supabase
    .from("guide_offers")
    .select("request_id")
    .eq("guide_id", guideId);
  if (!data) return new Set();
  return new Set(data.map((row) => row.request_id as string));
}

type RequestsFilter = "all" | "no-offer" | "offered";

export function GuideRequestsInboxScreen() {
  const [items, setItems] = React.useState<RequestRecord[]>([]);
  const [offeredIds, setOfferedIds] = React.useState<Set<string>>(new Set());
  const [panelRequestId, setPanelRequestId] = React.useState<string | null>(
    null,
  );
  const [filter, setFilter] = React.useState<RequestsFilter>("no-offer");
  const [didAutoSelect, setDidAutoSelect] = React.useState(false);

  React.useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await getOpenRequests(supabase);
        if (!ignore && data) setItems(data);

        // Fetch current user's guide_id to check offered requests
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!ignore && session?.user?.id) {
          const ids = await fetchOfferedRequestIds(session.user.id);
          if (!ignore) setOfferedIds(ids);
        }
      } catch {
        // leave empty
      }
    }

    void load();
    return () => {
      ignore = true;
    };
  }, []);

  const summary = {
    total: items.length,
    highBudget: items.filter((item) => item.budgetRub >= 15000).length,
  };

  const noOfferCount = items.filter((item) => !offeredIds.has(item.id)).length;
  const offeredCount = items.length - noOfferCount;

  React.useEffect(() => {
    if (didAutoSelect) return;
    if (items.length === 0) return;
    if (noOfferCount === 0) {
      setFilter("all");
    }
    setDidAutoSelect(true);
  }, [didAutoSelect, items.length, noOfferCount]);

  const filteredItems = React.useMemo(() => {
    if (filter === "no-offer") {
      return items.filter((item) => !offeredIds.has(item.id));
    }
    if (filter === "offered") {
      return items.filter((item) => offeredIds.has(item.id));
    }
    return items;
  }, [filter, items, offeredIds]);

  const panelRequest = panelRequestId
    ? items.find((i) => i.id === panelRequestId)
    : null;

  const tabs: Array<{ key: RequestsFilter; label: string; count: number }> = [
    { key: "all", label: "Все", count: items.length },
    { key: "no-offer", label: "Без моего предложения", count: noOfferCount },
    { key: "offered", label: "С моим предложением", count: offeredCount },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Badge variant="outline">Кабинет гида</Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Входящие запросы
          </h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            Здесь появляются запросы путешественников. Открывайте карточку
            запроса, чтобы разобрать задачу и собрать предложение под бюджет
            гостя.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="secondary">
            <Link href="/guide/bookings">Бронирования</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/guide/listings">Мои программы</Link>
          </Button>
        </div>
      </div>

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
              Пока нет новых запросов от путешественников.
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
            <div className="space-y-3">
              {filteredItems.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                  Нет запросов в этой категории
                </p>
              ) : null}
              {filteredItems.map((item, index) => {
                const alreadyOffered = offeredIds.has(item.id);
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
                        {alreadyOffered ? (
                          <span
                            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-primary/10 px-3.5 py-1.5 font-sans text-xs font-semibold tracking-[0.02em] text-primary"
                            aria-label="Вы уже отправили предложение на этот запрос"
                          >
                            ✓ Предложение отправлено
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => setPanelRequestId(item.id)}
                          >
                            Предложить цену
                          </Button>
                        )}
                      </div>
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
