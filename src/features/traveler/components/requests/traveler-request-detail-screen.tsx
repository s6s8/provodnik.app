import Link from "next/link";
import { ArrowLeft, CalendarDays, Users } from "lucide-react";

const INTEREST_LABELS: Record<string, string> = {
  history: "История",
  architecture: "Архитектура",
  nature: "Природа",
  food: "Гастрономия",
  art: "Искусство",
  active: "Активный отдых",
  adventure: "Активный отдых",
  religion: "Религия",
  kids: "Для детей",
  unusual: "Необычное",
  nightlife: "Ночная жизнь",
};

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TravelerRequestRecord } from "@/data/traveler-request/types";
import { TravelerRequestStatusBadge } from "@/features/traveler/components/requests/traveler-request-status";

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
  const dateLabel = formatDate(record.request.startDate);
  const timeLabel = record.request.startTime
    ? record.request.endTime
      ? `${record.request.startTime} – ${record.request.endTime}`
      : record.request.startTime
    : null;

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

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-foreground">
            {record.request.destination}
          </h1>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-4">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />
              {dateLabel}{timeLabel ? ` · ${timeLabel}` : ""}
            </span>
            <span className="inline-flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              {record.request.mode === "assembly"
                ? `Сборная группа · сейчас ${record.request.groupSizeCurrent ?? 1}${record.request.groupMax ? ` из ${record.request.groupMax}` : ''} чел.`
                : `${record.request.groupSize ?? 1} чел.`}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(record.request.interests ?? []).map((slug) => (
            <Badge key={slug} variant="secondary" className="normal-case tracking-normal text-xs font-medium">
              {INTEREST_LABELS[slug] ?? slug}
            </Badge>
          ))}
          <Badge variant="outline" className="normal-case tracking-normal text-xs font-medium">
            {record.request.mode === "private" ? "Своя группа" : "Сборная группа"}
          </Badge>
          <Badge variant="outline" className="normal-case tracking-normal text-xs font-medium">
            {formatRub(record.request.budgetPerPersonRub)} {"на чел."}
          </Badge>
        </div>
        {record.request.notes ? (
          <p className="text-sm text-muted-foreground">{record.request.notes}</p>
        ) : null}
      </div>

    </div>
  );
}
