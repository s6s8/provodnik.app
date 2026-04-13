"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { confirmOrderAction } from "@/app/(protected)/guide/orders/actions";
import type { BookingRow } from "@/lib/supabase/types";

function formatWhen(startsAt: string | null): string {
  if (!startsAt) return "Дата уточняется";
  const d = new Date(startsAt);
  if (Number.isNaN(d.getTime())) return startsAt;
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(minor: number, currency: string): string {
  try {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(minor / 100);
  } catch {
    return `${(minor / 100).toFixed(0)} ${currency}`;
  }
}

function statusLabel(
  status: BookingRow["status"],
): { text: string; className: string } {
  switch (status) {
    case "awaiting_guide_confirmation":
      return { text: "Ждёт подтверждения", className: "bg-yellow-100 text-yellow-800" };
    case "confirmed":
      return { text: "Забронировано", className: "bg-blue-100 text-blue-800" };
    case "completed":
      return { text: "Завершено", className: "bg-green-100 text-green-800" };
    case "cancelled":
      return { text: "Отменено", className: "bg-red-100 text-red-800" };
    case "no_show":
      return { text: "Не явился", className: "bg-red-100 text-red-800" };
    case "disputed":
      return { text: "Спор", className: "bg-orange-100 text-orange-800" };
    default:
      return { text: status, className: "bg-muted text-muted-foreground" };
  }
}

interface OrderCardProps {
  booking: BookingRow;
  onConfirmed?: (id: string) => void;
}

export function OrderCard({ booking, onConfirmed }: OrderCardProps) {
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [optimisticStatus, setOptimisticStatus] = React.useState<
    BookingRow["status"] | null
  >(null);

  const currentStatus = optimisticStatus ?? booking.status;
  const badge = statusLabel(currentStatus);
  const detailHref = `/guide/bookings/${booking.id}`;

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await confirmOrderAction(booking.id);
      if (result.ok) {
        setOptimisticStatus("confirmed");
        onConfirmed?.(booking.id);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {formatWhen(booking.starts_at)}
          </p>
          <p className="text-sm text-muted-foreground">
            {booking.party_size} участн. ·{" "}
            {formatPrice(booking.subtotal_minor, booking.currency)}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {booking.id.slice(0, 8)}
          </p>
        </div>
        <span
          className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}
        >
          {badge.text}
        </span>
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        {currentStatus === "awaiting_guide_confirmation" ? (
          <>
            <Button size="sm" disabled={isPending} onClick={handleConfirm}>
              {isPending ? "Подтверждаем…" : "Подтвердить"}
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <Link href={detailHref}>Написать</Link>
            </Button>
          </>
        ) : currentStatus === "confirmed" ? (
          <>
            <Button size="sm" asChild>
              <Link href={detailHref}>Написать</Link>
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <Link href={detailHref}>Открыть билет</Link>
            </Button>
          </>
        ) : currentStatus === "completed" ? (
          <Button size="sm" variant="ghost" asChild>
            <Link href={detailHref}>Открыть билет</Link>
          </Button>
        ) : (
          <Button size="sm" variant="ghost" asChild>
            <Link href={detailHref}>Подробнее</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

