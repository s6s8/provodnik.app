import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock, Users, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { INTEREST_CHIPS } from "@/data/interests";
import type { TravelerRequestRecord } from "@/data/traveler-request/types";
import { TravelerRequestStatusBadge } from "@/features/traveler/components/requests/traveler-request-status";
import { cn } from "@/lib/utils";

const INTEREST_LABEL_BY_ID: Record<string, string> = Object.fromEntries(
  INTEREST_CHIPS.map(({ id, label }) => [id, label]),
);

const BADGE_CLASS = "normal-case tracking-normal text-xs font-medium";

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
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-amber-200 bg-amber-50 text-amber-700";

  const budgetLabel = `${formatRub(request.budgetPerPersonRub)} на чел.`;

  const interests = request.interests ?? [];

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Button asChild variant="ghost" className="-ml-3 px-3">
            <Link href="/traveler/requests">
              <ArrowLeft className="size-4" />
              {"Мои запросы"}
            </Link>
          </Button>
          <TravelerRequestStatusBadge status={record.status} />
        </div>

        <h1 className="text-3xl font-semibold text-foreground">
          {request.destination}
        </h1>
      </div>

      <div className="space-y-3">
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
            className={cn(BADGE_CLASS, "border-emerald-200 bg-emerald-50 text-emerald-700")}
          >
            <Wallet className="size-3.5" />
            {budgetLabel}
          </Badge>
          {isAssembly && (
            <Badge variant="outline" className={cn(BADGE_CLASS, "border-blue-200 bg-blue-50 text-blue-700")}>
              Открытая группа
            </Badge>
          )}
          {request.dateFlexibility && request.dateFlexibility !== "exact" && (
            <Badge variant="outline" className={BADGE_CLASS}>
              {request.dateFlexibility === "few_days" ? "±пара дней" : "±неделя"}
            </Badge>
          )}
          {record.dateLocked === false && (
            <Badge variant="outline" className={BADGE_CLASS}>
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
          <div className="w-full max-w-[720px] whitespace-pre-line rounded-2xl border border-border/80 bg-[color-mix(in_srgb,var(--background)_76%,white_24%)] px-4 py-3 text-sm text-foreground">
            {request.notes}
          </div>
        ) : null}
      </div>
    </div>
  );
}
