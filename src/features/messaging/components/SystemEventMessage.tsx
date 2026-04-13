"use client";

import * as React from "react";

import { Separator } from "@/components/ui/separator";

export type SystemEventType =
  | "offer_sent"
  | "offer_accepted"
  | "offer_declined"
  | "booking_confirmed"
  | "moderation_rejected"
  | "review_request"
  | "dispute_opened"
  | "dispute_resolved"
  // New bid-first event types
  | "request_created"
  | "bid_submitted"
  | "guide_amended"
  | "bid_accepted"
  | "booking_created"
  | "guide_confirmed"
  | "participant_joined"
  | "booking_completed";

export interface SystemEventPayload {
  event_type: SystemEventType;
  actor_role?: "guide" | "traveler" | "admin";
  listing_title?: string;
  amount_minor?: number;
  currency?: string;
  reason?: string;
  // Bid-first fields
  guide_name?: string;
  price?: number;
  date?: string;
  participant_name?: string;
  participant_count?: number;
  changed_fields?: Record<string, string | number>;
}

function formatChangedFields(fields: Record<string, string | number>): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const FIELD_LABELS: Record<string, string> = {
    price: "Цена",
    date: "Дата",
    time: "Время",
  };
  let first = true;
  for (const [key, value] of Object.entries(fields)) {
    if (!first) parts.push(", ");
    const label = FIELD_LABELS[key] ?? key;
    const displayValue = key === "price" && typeof value === "number"
      ? `${new Intl.NumberFormat("ru-RU").format(value)} ₽`
      : String(value);
    parts.push(
      <React.Fragment key={key}>
        <strong>{label}:</strong> {displayValue}
      </React.Fragment>
    );
    first = false;
  }
  return parts;
}

const EVENT_LABELS: Record<SystemEventType, (p: SystemEventPayload) => React.ReactNode> =
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
    // Bid-first events
    request_created: () => "Путешественник создал запрос",
    bid_submitted: (p) => (
      <>
        {`Гид${p.guide_name ? ` ${p.guide_name}` : ""} отправил предложение`}
        {p.price ? <> — <strong>Цена:</strong> {new Intl.NumberFormat("ru-RU").format(p.price)} ₽</> : null}
        {p.date ? <>, <strong>Дата:</strong> {p.date}</> : null}
      </>
    ),
    guide_amended: (p) => (
      <>
        {`Гид изменил предложение`}
        {p.changed_fields && Object.keys(p.changed_fields).length > 0
          ? <> — {formatChangedFields(p.changed_fields)}</>
          : null}
      </>
    ),
    bid_accepted: (p) =>
      `Путешественник принял предложение${p.guide_name ? ` от ${p.guide_name}` : ""}`,
    booking_created: (p) =>
      `Поездка создана${p.date ? ` · ${p.date}` : ""}`,
    guide_confirmed: () => "Гид подтвердил встречу",
    participant_joined: (p) =>
      `${p.participant_name ?? "Участник"} присоединился к запросу${p.participant_count ? ` — теперь ${p.participant_count} участников` : ""}`,
    booking_completed: () => "Поездка завершена",
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
  const label: React.ReactNode = labelFn ? labelFn(payload) : eventType;

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
