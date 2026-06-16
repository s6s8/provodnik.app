"use client";

import * as React from "react";
import Link from "next/link";
import { Inbox } from "lucide-react";

import { type RequestRecord, type BookingRecord, getGuideBookings } from "@/data/supabase/queries";
import { loadGuideInboxRequests } from "@/app/(protected)/guide/inbox/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatTimeRange } from "@/lib/dates";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

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
}

const requestChipClassName = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";
const assemblyChipClassName = `${requestChipClassName} bg-[var(--brand-50)] text-[var(--primary)]`;
const privateChipClassName = `${requestChipClassName} border border-[var(--outline)] bg-[var(--surface-lowest)] text-[var(--on-surface-muted)]`;
const flexibleDatesChipClassName = `${requestChipClassName} bg-[var(--brand-50)] text-[var(--primary)]`;
const exactDateChipClassName = `${requestChipClassName} bg-[var(--surface)] text-[var(--on-surface-muted)]`;

async function fetchOfferedRequestIds(guideId: string): Promise<OffersByRequest> {
  const supabase = createSupabaseBrowserClient();
  const { data } = await supabase
    .from("guide_offers")
    .select("id, request_id, starts_at, capacity, price_minor")
    .eq("guide_id", guideId);
  if (!data) return { offeredIds: new Set(), offerIdByRequestId: new Map() };
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
  return { offeredIds, offerIdByRequestId };
}

export function GuideRequestsInboxScreen() {
  const [items, setItems] = React.useState<RequestRecord[]>([]);
  const [bookings, setBookings] = React.useState<BookingRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
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
        const { data } = await loadGuideInboxRequests();
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
    <div className="space-y-6 bg-[var(--surface)] text-[var(--on-surface)]">
      <section className="rounded-[28px] border border-[var(--outline)] bg-[var(--surface-lowest)] p-6 shadow-[var(--card-shadow)] sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--primary)]">
              Биржа запросов
            </p>
            <div className="space-y-2">
              <h1 className="font-[family:var(--font-rubik)] text-[clamp(30px,4.4vw,44px)] font-semibold leading-[1.04] text-[var(--on-surface)]">
                Открытые запросы, на которые можно откликнуться сейчас
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-[var(--on-surface-muted)] sm:text-base">
                Выберите подходящий запрос, быстро оцените дату, группу и бюджет, затем отправьте предложение путешественнику.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-1">
            <div className="rounded-[18px] border border-[var(--outline)] bg-[var(--surface-lowest)] p-3 shadow-[var(--card-shadow)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--on-surface-muted)]">
                Новые
              </p>
              <p className="mt-1 text-2xl font-semibold text-[var(--on-surface)] tabular-nums">
                {newCount}
              </p>
            </div>
            <div className="rounded-[18px] border border-[var(--outline)] bg-[var(--surface-lowest)] p-3 shadow-[var(--card-shadow)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--on-surface-muted)]">
                Отклики
              </p>
              <p className="mt-1 text-2xl font-semibold text-[var(--on-surface)] tabular-nums">
                {myOffersCount}
              </p>
            </div>
            <div className="rounded-[18px] border border-[var(--outline)] bg-[var(--surface-lowest)] p-3 shadow-[var(--card-shadow)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--on-surface-muted)]">
                Брони
              </p>
              <p className="mt-1 text-2xl font-semibold text-[var(--on-surface)] tabular-nums">
                {activeBookings.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[var(--card-radius)] border border-[var(--outline)] bg-[var(--surface-lowest)] p-5 shadow-[var(--card-shadow)] sm:p-6">
        {isLoading ? (
          <p className="text-sm font-medium text-[var(--on-surface-muted)]">Загрузка запросов…</p>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Inbox className="size-7 text-[var(--primary)]" strokeWidth={1.5} />}
            title="Запросов пока нет"
            description="Путешественники публикуют новые запросы каждый день — скоро здесь появятся подходящие заявки."
          />
        ) : (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
                          ? "inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--primary)] bg-[var(--brand-50)] px-4 py-2 text-sm font-semibold text-[var(--primary)] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
                          : "inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--outline)] bg-[var(--surface-lowest)] px-4 py-2 text-sm font-semibold text-[var(--on-surface-muted)] transition-colors duration-200 hover:border-[var(--primary)] hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
                      }
                    >
                      <span>{tab.label}</span>
                      <span
                        className={
                          isSelected
                            ? "rounded-full bg-[var(--primary)] px-2 py-0.5 text-xs text-white tabular-nums"
                            : "rounded-full bg-[var(--surface)] px-2 py-0.5 text-xs text-[var(--on-surface-muted)] tabular-nums"
                        }
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {uniqueCities.length > 1 ? (
                  <select
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className="h-10 rounded-[14px] border border-[var(--outline)] bg-[var(--surface-lowest)] px-3 text-sm font-medium text-[var(--on-surface)] outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--brand-50)]"
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
                  className="h-10 rounded-[14px] border border-[var(--outline)] bg-[var(--surface-lowest)] px-3 text-sm font-medium text-[var(--on-surface)] outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--brand-50)]"
                  aria-label="Сортировка"
                >
                  <option value="newest">Новые сначала</option>
                  <option value="date">По дате запроса</option>
                  <option value="size">По размеру группы</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {filter === "confirmed" ? (
                activeBookings.length === 0 ? (
                  <p className="rounded-[18px] border border-[var(--outline)] bg-[var(--surface)] px-4 py-6 text-center text-sm text-[var(--on-surface-muted)]">
                    {emptyText}
                  </p>
                ) : (
                  activeBookings.map((booking) => (
                    <Link
                      key={booking.id}
                      href={`/guide/bookings/${booking.id}`}
                      className="block rounded-[var(--card-radius)] border border-[var(--outline)] bg-[var(--surface-lowest)] p-5 shadow-[var(--card-shadow)] transition-colors duration-200 hover:border-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-semibold text-[var(--on-surface)]">{booking.destination}</p>
                          <p className="text-sm text-[var(--on-surface-muted)]">{booking.dateLabel}</p>
                        </div>
                        <span className="rounded-full bg-[var(--brand-50)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                          Подтверждено
                        </span>
                      </div>
                      {booking.priceRub > 0 ? (
                        <p className="mt-3 text-sm font-medium text-[var(--on-surface-muted)]">
                          {booking.priceRub.toLocaleString("ru-RU")} ₽
                        </p>
                      ) : null}
                    </Link>
                  ))
                )
              ) : null}
              {filter !== "confirmed" && filteredItems.length === 0 ? (
                <p className="rounded-[18px] border border-[var(--outline)] bg-[var(--surface)] px-4 py-6 text-center text-sm text-[var(--on-surface-muted)]">
                  {emptyText}
                </p>
              ) : null}
              {filter !== "confirmed" && filteredItems.map((item) => {
                const alreadyOffered = offeredIds.has(item.id);
                const matched = isMatchedRequest(item, specializations);
                const offerMeta = offerIdByRequestId.get(item.id);
                const offerId = offerMeta?.id;
                const showQaPanel = alreadyOffered && !!offerId;
                const hasFlexibleDates = item.dateFlexibility === "few_days" || item.date_locked === false;
                return (
                  <article
                    key={item.id}
                    className="rounded-[var(--card-radius)] border border-[var(--outline)] bg-[var(--surface-lowest)] p-5 shadow-[var(--card-shadow)] transition-colors duration-200 hover:border-[var(--primary)] sm:p-6"
                  >
                    {/* Card header */}
                    <GuideInboxCardHeader item={item} matched={matched} />

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className={item.mode === "assembly" ? assemblyChipClassName : privateChipClassName}>
                        {item.mode === "assembly" ? "Сборная группа" : "Своя группа"}
                      </span>
                      <span className={hasFlexibleDates ? flexibleDatesChipClassName : exactDateChipClassName}>
                        {hasFlexibleDates ? "Гибкие даты" : "Точная дата"}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--on-surface-muted)]">
                        <span className="size-2 rounded-full bg-[var(--gold)]" aria-hidden="true" />
                        {item.offerCount > 0
                          ? `${item.offerCount} откл. гидов`
                          : "Откликов пока нет"}
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="mt-4 grid gap-3 text-sm leading-relaxed text-[var(--on-surface-muted)] sm:grid-cols-3">
                      <p className="rounded-[18px] bg-[var(--surface)] px-4 py-3">
                        <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--primary)]">
                          Даты
                        </span>
                        <span className="font-medium text-[var(--on-surface)]">
                          {item.dateLabel}
                        </span>
                        {formatTimeRange(item.startTime, item.endTime) && (
                          <>
                            {" · "}
                            <span className="font-medium text-[var(--on-surface)]">Время:</span>{" "}
                            {formatTimeRange(item.startTime, item.endTime)}
                          </>
                        )}
                      </p>
                      <p className="rounded-[18px] bg-[var(--surface)] px-4 py-3">
                        <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--primary)]">
                          Группа
                        </span>
                        <span className="font-medium text-[var(--on-surface)]">
                          {item.groupSize} чел.
                        </span>
                      </p>
                      <p className="rounded-[18px] bg-[var(--surface)] px-4 py-3">
                        <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--primary)]">
                          Бюджет
                        </span>
                        <span className="font-medium text-[var(--on-surface)]">
                          {item.budgetLabel}
                        </span>
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 flex flex-col gap-3 border-t border-[var(--outline)] pt-5 sm:flex-row sm:items-center">
                      {alreadyOffered ? (
                        <div className="flex flex-col gap-2">
                          <span className="inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--brand-50)] px-3.5 py-1.5 text-xs font-semibold text-[var(--primary)]">
                            Предложение отправлено
                          </span>
                          {offerMeta && (offerMeta.starts_at != null || offerMeta.capacity != null || offerMeta.price_minor != null) ? (
                            <p className="text-xs leading-relaxed text-[var(--on-surface-muted)]">
                              Вы предложили:
                              {offerMeta.starts_at ? ` ${new Date(offerMeta.starts_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}` : ""}
                              {offerMeta.capacity != null ? ` · ${offerMeta.capacity} чел.` : ""}
                              {offerMeta.price_minor != null ? ` · ${Math.round(offerMeta.price_minor / 100 / (offerMeta.capacity ?? 1)).toLocaleString("ru-RU")} ₽/чел.` : ""}
                            </p>
                          ) : null}
                        </div>
                      ) : isApproved ? (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setPanelRequestId(item.id)}
                          className="rounded-[14px] bg-[var(--primary)] px-5 text-white shadow-[0_12px_24px_-16px_var(--primary)] hover:-translate-y-0.5 hover:bg-[var(--primary-hover)]"
                        >
                          Сделать предложение
                        </Button>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            disabled
                            className="rounded-[14px] bg-[var(--primary)] px-5 text-white"
                          >
                            Доступно после верификации
                          </Button>
                          <Link
                            href="/guide/profile#verification"
                            className="text-xs font-semibold text-[var(--primary)] underline-offset-2 hover:underline"
                          >
                            Пройти верификацию →
                          </Link>
                        </div>
                      )}
                      <Link
                        href={`/guide/inbox/${item.id}`}
                        className="text-sm font-semibold text-[var(--primary)] underline-offset-2 hover:underline sm:ml-auto"
                        aria-label={`Открыть полный запрос: ${item.destination}`}
                      >
                        Подробнее →
                      </Link>
                    </div>

                    {/* Q&A panel — shown when guide has sent an offer */}
                    {showQaPanel ? (
                      <div className="mt-5 border-t border-[var(--outline)] pt-5">
                        <GuideOfferQaPanel key={offerId} offerId={offerId} />
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </section>

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
