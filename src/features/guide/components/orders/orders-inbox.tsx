"use client";

import * as React from "react";
import type { BookingWithListing } from "@/lib/supabase/types";
import { OrderCard } from "./order-card";

type TabKey =
  | "pending"
  | "awaiting"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "disputed"
  | "all";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "pending", label: "Новые" },
  { key: "awaiting", label: "Ждут подтверждения" },
  { key: "confirmed", label: "Забронированы" },
  { key: "completed", label: "Завершены" },
  { key: "cancelled", label: "Отменены" },
  { key: "disputed", label: "Спорные" },
  { key: "all", label: "Все" },
];

type ViewMode = "events" | "orders";

function isCancelledLike(status: BookingWithListing["status"]): boolean {
  return status === "cancelled" || status === "no_show";
}

function filterByTab(bookings: BookingWithListing[], tab: TabKey): BookingWithListing[] {
  switch (tab) {
    case "pending":
      return bookings.filter((b) => b.status === "pending");
    case "awaiting":
      return bookings.filter((b) => b.status === "awaiting_guide_confirmation");
    case "confirmed":
      return bookings.filter((b) => b.status === "confirmed");
    case "completed":
      return bookings.filter((b) => b.status === "completed");
    case "cancelled":
      return bookings.filter((b) => isCancelledLike(b.status));
    case "disputed":
      return bookings.filter((b) => b.status === "disputed");
    case "all":
    default:
      return bookings;
  }
}

function sortByStartsAtDesc(a: BookingWithListing, b: BookingWithListing): number {
  const aKey = a.starts_at ?? "";
  const bKey = b.starts_at ?? "";
  if (aKey === bKey) return a.created_at < b.created_at ? 1 : -1;
  if (!aKey) return 1;
  if (!bKey) return -1;
  return aKey < bKey ? 1 : -1;
}

function groupByDate(
  bookings: BookingWithListing[],
): Array<{ date: string; label: string; items: BookingWithListing[] }> {
  const map = new Map<string, BookingWithListing[]>();
  for (const b of bookings) {
    const key = b.starts_at ? b.starts_at.slice(0, 10) : "no-date";
    const existing = map.get(key) ?? [];
    existing.push(b);
    map.set(key, existing);
  }

  const groups = Array.from(map.entries()).map(([date, items]) => ({
    date,
    label:
      date === "no-date"
        ? "Дата уточняется"
        : new Date(date).toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
    items: items.slice().sort(sortByStartsAtDesc),
  }));

  groups.sort((a, b) => {
    if (a.date === "no-date") return 1;
    if (b.date === "no-date") return -1;
    return a.date < b.date ? 1 : -1;
  });

  return groups;
}

interface OrdersInboxProps {
  initialBookings: BookingWithListing[];
}

export function OrdersInbox({ initialBookings }: OrdersInboxProps) {
  const [bookings, setBookings] = React.useState<BookingWithListing[]>(initialBookings);
  const [activeTab, setActiveTab] = React.useState<TabKey>("awaiting");
  const [viewMode, setViewMode] = React.useState<ViewMode>("orders");

  const counts = React.useMemo(
    () => ({
      pending: bookings.filter((b) => b.status === "pending").length,
      awaiting: bookings.filter((b) => b.status === "awaiting_guide_confirmation")
        .length,
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      completed: bookings.filter((b) => b.status === "completed").length,
      cancelled: bookings.filter((b) => isCancelledLike(b.status)).length,
      disputed: bookings.filter((b) => b.status === "disputed").length,
      all: bookings.length,
    }),
    [bookings],
  );

  const filteredBookings = React.useMemo(
    () => filterByTab(bookings, activeTab).slice().sort(sortByStartsAtDesc),
    [bookings, activeTab],
  );

  React.useEffect(() => {
    if (counts.awaiting > 0) setActiveTab("awaiting");
    else if (counts.pending > 0) setActiveTab("pending");
    else if (counts.confirmed > 0) setActiveTab("confirmed");
  }, []); // only on mount

  const handleConfirmed = React.useCallback((id: string) => {
    setBookings((prev) =>
      prev.map((b): BookingWithListing =>
        b.id === id ? { ...b, status: "confirmed" as const } : b,
      ),
    );
  }, []);

  const grouped = React.useMemo(() => groupByDate(filteredBookings), [filteredBookings]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 border-b border-border pb-3">
        {TABS.map((tab) => {
          const count = counts[tab.key];
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {tab.label}
              <span
                className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-xs ${
                  isActive
                    ? "bg-background/20 text-background"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filteredBookings.length > 0 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMode("orders")}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              viewMode === "orders"
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            По заказам
          </button>
          <button
            type="button"
            onClick={() => setViewMode("events")}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              viewMode === "events"
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            По событиям
          </button>
        </div>
      )}

      {filteredBookings.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {activeTab === "awaiting"
            ? "Нет бронирований, ожидающих подтверждения."
            : activeTab === "completed"
              ? "Нет завершённых бронирований."
              : "Нет бронирований в этой категории."}
        </p>
      ) : viewMode === "events" ? (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.date} className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                {group.label}
              </h3>
              <div className="space-y-3">
                {group.items.map((b) => (
                  <OrderCard key={b.id} booking={b} onConfirmed={handleConfirmed} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((b) => (
            <OrderCard key={b.id} booking={b} onConfirmed={handleConfirmed} />
          ))}
        </div>
      )}
    </div>
  );
}

