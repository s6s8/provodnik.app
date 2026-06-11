import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock, Users, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { INTEREST_CHIPS } from "@/data/interests";
import type { TravelerRequestRecord } from "@/data/traveler-request/types";
import { CancelRequestButton } from "@/features/traveler/components/requests/cancel-request-button";
import { TravelerRequestStatusBadge } from "@/features/traveler/components/requests/traveler-request-status";
import { BADGE_CLASS } from "@/lib/styles";
import { cn } from "@/lib/utils";

const INTEREST_LABEL_BY_ID: Record<string, string> = Object.fromEntries(
  INTEREST_CHIPS.map(({ id, label }) => [id, label]),
);

function formatRub(amount: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const monthDay = d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  return `${monthDay} ${d.getFullYear()}`;
}

function formatPublishedAt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const date = d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `Опубликован ${date}, ${time}`;
}

interface Props {
  record: TravelerRequestRecord;
}

export function TravelerRequestDetailScreen({ record }: Props) {
  const request = record.request;

  const dateLabel = formatDate(request.startDate);
  const timeLabel = request.startTime
    ? request.endTime
      ? `${request.startTime} – ${request.endTime}`
      : request.startTime
    : "—";

  const isAssembly = request.mode === "assembly";
  const capacity = isAssembly ? request.groupMax ?? null : null;
  const current = isAssembly ? request.groupSizeCurrent ?? 1 : request.groupSize ?? 1;
  const hasCapacity = capacity != null;
  const countLabel = hasCapacity ? `${current} из ${capacity} чел.` : `${current} чел.`;
  const countFull = hasCapacity && current >= capacity;
  const countColor = !hasCapacity
    ? ""
    : countFull
      ? "border-success/30 bg-success/10 text-success"
      : "border-warning/30 bg-warning/10 text-warning";

  const budgetLabel =
    request.budgetPerPersonRub == null
      ? "Бюджет не указан"
      : `${formatRub(request.budgetPerPersonRub)} на чел.`;

  const publishedAt = formatPublishedAt(record.createdAt);
  const interests = request.interests ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" className="-ml-3 px-3">
          <Link href="/traveler/requests">
            <ArrowLeft className="size-4" />
            {"Мои запросы"}
          </Link>
        </Button>
        <TravelerRequestStatusBadge status={record.status} />
      </div>

      <div className="space-y-3 rounded-lg border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">
              {request.destination}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">{publishedAt}</p>
          </div>
          <CancelRequestButton requestId={record.id} status={record.status} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={BADGE_CLASS}>
            <CalendarDays className="size-3.5" />
            {dateLabel}
          </Badge>
          <Badge variant="outline" className={BADGE_CLASS}>
            <Clock className="size-3.5" />
            {timeLabel}
          </Badge>
          <Badge variant="outline" className={cn(BADGE_CLASS, countColor)}>
            <Users className="size-3.5" />
            {countLabel}
          </Badge>
          <Badge
            variant="outline"
            className={cn(BADGE_CLASS, "border-success/30 bg-success/10 text-success")}
          >
            <Wallet className="size-3.5" />
            {budgetLabel}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              BADGE_CLASS,
              request.mode === "assembly"
                ? "border-sky-200 bg-sky-100 text-sky-700"
                : "border-purple-200 bg-purple-100 text-purple-700",
            )}
          >
            {request.mode === "assembly" ? "Сборная группа" : "Своя группа"}
          </Badge>
          {request.dateFlexibility && request.dateFlexibility !== "exact" && (
            <Badge variant="outline" className={cn(BADGE_CLASS, "border-emerald-200 bg-emerald-100 text-emerald-700")}>
              ±пара дней
            </Badge>
          )}
          {record.dateLocked === false && (
            <Badge variant="outline" className={cn(BADGE_CLASS, "border-emerald-200 bg-emerald-100 text-emerald-700")}>
              Гид может предлагать даты
            </Badge>
          )}
        </div>

        {interests.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {interests.map((slug) => (
              <Badge key={slug} variant="secondary" className={BADGE_CLASS}>
                {INTEREST_LABEL_BY_ID[slug] ?? slug}
              </Badge>
            ))}
          </div>
        ) : null}

        {request.notes ? (
          <div className="w-full max-w-[720px] whitespace-pre-line rounded-2xl border border-border/80 bg-card px-4 py-3 text-sm text-foreground">
            {request.notes}
          </div>
        ) : null}
      </div>
    </div>
  );
}
