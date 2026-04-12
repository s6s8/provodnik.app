"use client";

import { Separator } from "@/components/ui/separator";

export type SystemEventType =
  | "offer_sent"
  | "offer_accepted"
  | "offer_declined"
  | "booking_confirmed"
  | "moderation_rejected"
  | "review_request"
  | "dispute_opened"
  | "dispute_resolved";

export interface SystemEventPayload {
  event_type: SystemEventType;
  actor_role?: "guide" | "traveler" | "admin";
  listing_title?: string;
  amount_minor?: number;
  currency?: string;
  reason?: string;
}

const EVENT_LABELS: Record<SystemEventType, (p: SystemEventPayload) => string> =
  {
    offer_sent: (p) =>
      `Гид отправил предложение${p.listing_title ? ` — «${p.listing_title}»` : ""}${p.amount_minor ? ` за ${p.amount_minor / 100} ${p.currency ?? "₽"}` : ""}`,
    offer_accepted: () => "Путешественник принял предложение",
    offer_declined: () => "Путешественник отклонил предложение",
    booking_confirmed: () => "Бронирование подтверждено",
    moderation_rejected: (p) =>
      `Объявление отклонено модератором${p.reason ? `: ${p.reason}` : ""}`,
    review_request: () => "Пора оставить отзыв о поездке",
    dispute_opened: () => "Открыт спор",
    dispute_resolved: (p) =>
      `Спор закрыт${p.reason ? `: ${p.reason}` : ""}`,
  };

function formatEventTime(createdAt: string): string {
  return new Date(createdAt).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  eventType: SystemEventType;
  payload: SystemEventPayload;
  createdAt: string;
}

export function SystemEventMessage({ eventType, payload, createdAt }: Props) {
  const labelFn = EVENT_LABELS[eventType];
  const label = labelFn ? labelFn(payload) : eventType;

  return (
    <div className="flex flex-col items-center gap-1 py-2">
      <div className="flex items-center gap-3 w-full">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground px-2 shrink-0">
          {label}
        </span>
        <Separator className="flex-1" />
      </div>
      <time
        className="text-[0.6875rem] text-muted-foreground/70"
        dateTime={createdAt}
      >
        {formatEventTime(createdAt)}
      </time>
    </div>
  );
}
