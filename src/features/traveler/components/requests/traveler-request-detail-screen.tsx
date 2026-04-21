import Link from "next/link";
import { ArrowLeft, CalendarDays, Users } from "lucide-react";

const INTEREST_LABELS: Record<string, string> = {
  history: "История",
  architecture: "Архитектура",
  nature: "Природа",
  food: "Гастрономия",
  art: "Искусство",
  active: "Активный отдых",
  religion: "Религия",
  kids: "Для детей",
  unusual: "Необычное",
  nightlife: "Ночная жизнь",
};

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type {
  TravelerRequestRecord,
  TravelerRequestTimelineEvent,
} from "@/data/traveler-request/types";
import { TravelerRequestStatusBadge } from "@/features/traveler/components/requests/traveler-request-status";
import type { GuideOfferRow } from "@/lib/supabase/types";
import type { QaThread } from "@/lib/supabase/qa-threads";
import { OfferCard } from "./offer-card";

function formatRub(amount: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatTimelineDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface GuideInfo {
  guide_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Props {
  record: TravelerRequestRecord;
  offers?: GuideOfferRow[];
  guideInfoMap?: Map<string, GuideInfo>;
  qaThreads?: Map<string, QaThread>;
  requestId?: string;
  onSendQa?: (threadId: string, body: string) => Promise<void>;
  onGetOrCreateQaThread?: (offerId: string) => Promise<string>;
}

export function TravelerRequestDetailScreen({
  record,
  offers = [],
  guideInfoMap = new Map(),
  qaThreads = new Map(),
  requestId,
  onSendQa,
  onGetOrCreateQaThread,
}: Props) {
  const timeline: TravelerRequestTimelineEvent[] = [];
  const dateLabel = record.request.startDate;

  // Map TravelerRequestStatus back to DB status for canAccept check
  const isOpen = record.status === "submitted" || record.status === "offers_received" || record.status === "shortlisted";

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
          <Badge variant="outline">{"Кабинет путешественника"}</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {record.request.destination}
          </h1>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-4">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />
              {dateLabel}
            </span>
            <span className="inline-flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              {record.request.mode === "assembly"
                ? `${record.request.groupSizeCurrent ?? 1} чел. (сборная)`
                : `${record.request.groupSize ?? 1} чел.`}
            </span>
          </div>
        </div>
      </div>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle>{"Кратко о запросе"}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {"Структурированное описание, чтобы сравнивать предложения гидов."}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(record.request.interests ?? []).map((slug) => (
              <Badge key={slug} variant="secondary">
                {INTEREST_LABELS[slug] ?? slug}
              </Badge>
            ))}
            <Badge variant="outline">
              {record.request.mode === "private" ? "Своя группа" : "Сборная группа"}
            </Badge>
            <Badge variant="outline">
              {"Бюджет"} {formatRub(record.request.budgetPerPersonRub)}{" "}
              {"на человека"}
            </Badge>
          </div>

          {record.request.notes ? (
            <div className="rounded-lg border border-border/70 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">{"Комментарии"}</p>
              <p className="mt-1 text-sm text-foreground">
                {record.request.notes}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-3">
        <div className="flex items-end justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">
              {"Предложения гидов"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {offers.length === 0
                ? "Ожидаем предложений от гидов."
                : `${offers.length} предл.`}
            </p>
          </div>
          <Badge variant="outline">{offers.length}</Badge>
        </div>

        {offers.length === 0 ? (
          <Card className="border-border/70 bg-card/90">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">{"Пока нет откликов"}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {"Гиды увидят запрос и предложат варианты."}
              </p>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-3">
            {offers.map((offer) =>
              onSendQa && onGetOrCreateQaThread && requestId ? (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  guideInfo={guideInfoMap.get(offer.guide_id) ?? null}
                  qaThread={qaThreads.get(offer.id) ?? null}
                  requestId={requestId}
                  requestStatus={isOpen ? "open" : record.status}
                  onSendQa={onSendQa}
                  onGetOrCreateQaThread={onGetOrCreateQaThread}
                />
              ) : null,
            )}
          </div>
        )}
      </div>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle>{"Хронология"}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {"Что происходило с этим запросом по шагам."}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">Событий пока нет.</p>
          ) : (
            <div className="space-y-3">
              {timeline.map((event, index) => (
                <TimelineRow
                  key={event.id}
                  event={event}
                  isFirst={index === 0}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TimelineRow({
  event,
  isFirst,
}: {
  event: TravelerRequestTimelineEvent;
  isFirst: boolean;
}) {
  return (
    <div className="grid gap-2 rounded-lg border border-border/70 bg-background/60 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{event.title}</p>
          {event.description ? (
            <p className="text-sm text-muted-foreground">{event.description}</p>
          ) : null}
        </div>
        <Badge variant={isFirst ? "secondary" : "outline"}>
          {formatTimelineDate(event.at)}
        </Badge>
      </div>
    </div>
  );
}
