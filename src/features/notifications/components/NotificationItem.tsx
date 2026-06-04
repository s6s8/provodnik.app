"use client";

import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  Bell,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  FileCheck,
  FileX,
  MessageSquare,
  Package,
  Star,
  type LucideIcon,
} from "lucide-react";

import type { NotificationRow2 } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const EVENT_LABELS: Record<string, string> = {
  new_offer: "Новое предложение от гида",
  offer_expiring: "Предложение скоро истекает",
  booking_created: "Создано бронирование",
  booking_confirmed: "Бронирование подтверждено",
  booking_cancelled: "Бронирование отменено",
  booking_completed: "Поездка завершена",
  dispute_opened: "Открыт спор",
  review_requested: "Оставьте отзыв",
  admin_alert: "Сообщение от администратора",
  listing_approved: "Объявление одобрено",
  listing_rejected: "Объявление отклонено",
};

const EVENT_ICONS: Record<string, LucideIcon> = {
  new_offer: Package,
  offer_expiring: CalendarClock,
  booking_created: CalendarCheck,
  booking_confirmed: CheckCircle2,
  booking_cancelled: Ban,
  booking_completed: CheckCircle2,
  dispute_opened: AlertTriangle,
  review_requested: Star,
  admin_alert: MessageSquare,
  listing_approved: FileCheck,
  listing_rejected: FileX,
};

const ACTION_CTA: Record<string, string> = {
  new_offer: "Посмотреть предложение",
  offer_expiring: "Ответить",
  booking_created: "Открыть бронь",
  review_requested: "Написать отзыв",
  dispute_opened: "Перейти",
};

function formatRelativeTime(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ru });
  } catch {
    return "";
  }
}

export type NotificationItemProps = {
  notification: NotificationRow2;
  onMarkRead: (id: string) => void;
};

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const iconKey = notification.kind ?? notification.event_type ?? "";
  const Icon = EVENT_ICONS[iconKey] ?? Bell;
  const ctaLabel = ACTION_CTA[iconKey] ?? null;
  const displayTitle =
    notification.title ??
    EVENT_LABELS[notification.kind ?? notification.event_type ?? ""] ??
    "Уведомление";
  const displayBody = notification.body ?? null;
  const unread = notification.status !== "read";

  return (
    <button
      type="button"
      className={cn(
        "flex w-full gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60",
        unread && "bg-surface-high",
      )}
      onClick={() => {
        onMarkRead(notification.id);
        if (notification.href) {
          window.location.href = notification.href;
        }
      }}
    >
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-glass-border bg-surface-high/72 text-primary">
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-foreground leading-snug">
          {displayTitle}
        </span>
        {displayBody && (
          <span className="mt-0.5 block text-xs text-muted-foreground leading-snug">
            {displayBody}
          </span>
        )}
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {formatRelativeTime(notification.created_at)}
        </span>
        {ctaLabel && notification.href && (
          <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary">
            {ctaLabel}
            <ArrowRight className="size-3" aria-hidden />
          </span>
        )}
      </span>
    </button>
  );
}
