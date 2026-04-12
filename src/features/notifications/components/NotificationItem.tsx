"use client";

import {
  AlertTriangle,
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

function formatCreatedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export type NotificationItemProps = {
  notification: NotificationRow2;
  onMarkRead: (id: string) => void;
};

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const label = EVENT_LABELS[notification.event_type] ?? notification.event_type;
  const Icon = EVENT_ICONS[notification.event_type] ?? Bell;
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
      }}
    >
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-glass-border bg-surface-high/72 text-primary">
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-foreground leading-snug">{label}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {formatCreatedAt(notification.created_at)}
        </span>
      </span>
    </button>
  );
}
