import Link from "next/link";
import { ArrowLeft, CalendarDays, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type {
  TravelerOffer,
  TravelerRequestRecord,
  TravelerRequestTimelineEvent,
} from "@/data/traveler-request/types";
import { TravelerRequestStatusBadge } from "@/features/traveler/components/requests/traveler-request-status";

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

export function TravelerRequestDetailScreen({
  record,
}: {
  record: TravelerRequestRecord;
}) {
  const offers: TravelerOffer[] = [];
  const timeline: TravelerRequestTimelineEvent[] = [];
  const dateLabel = `${record.request.startDate} to ${record.request.endDate}`;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Button asChild variant="ghost" className="-ml-3 px-3">
            <Link href="/traveler/requests">
              <ArrowLeft className="size-4" />
              {"\u041c\u043e\u0438 \u0437\u0430\u043f\u0440\u043e\u0441\u044b"}
            </Link>
          </Button>
          <TravelerRequestStatusBadge status={record.status} />
        </div>

        <div className="space-y-2">
          <Badge variant="outline">
            {"\u041a\u0430\u0431\u0438\u043d\u0435\u0442 \u043f\u0443\u0442\u0435\u0448\u0435\u0441\u0442\u0432\u0435\u043d\u043d\u0438\u043a\u0430"}
          </Badge>
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
              {record.request.groupSize} traveler
              {record.request.groupSize === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle>
            {"\u041a\u0440\u0430\u0442\u043a\u043e \u043e \u0437\u0430\u043f\u0440\u043e\u0441\u0435"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {
              "\u0421\u0442\u0440\u0443\u043a\u0442\u0443\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u043e\u0435 \u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0435, \u0447\u0442\u043e\u0431\u044b \u0441\u0440\u0430\u0432\u043d\u0438\u0432\u0430\u0442\u044c \u043f\u0440\u0435\u0434\u043b\u043e\u0436\u0435\u043d\u0438\u044f \u0433\u0438\u0434\u043e\u0432."
            }
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{record.request.experienceType}</Badge>
            <Badge variant="outline">
              {record.request.groupPreference === "private"
                ? "\u0422\u043e\u043b\u044c\u043a\u043e \u0432\u0430\u0448\u0430 \u043a\u043e\u043c\u043f\u0430\u043d\u0438\u044f"
                : "\u0413\u043e\u0442\u043e\u0432\u044b \u043a \u0433\u0440\u0443\u043f\u043f\u0435"}
            </Badge>
            <Badge variant="outline">
              {"\u0411\u044e\u0434\u0436\u0435\u0442"} {formatRub(record.request.budgetPerPersonRub)}{" "}
              {"\u043d\u0430 \u0447\u0435\u043b\u043e\u0432\u0435\u043a\u0430"}
            </Badge>
            <Badge variant="outline">
              {record.request.openToJoiningOthers
                ? "\u041c\u043e\u0436\u043d\u043e \u043f\u0440\u0438\u0441\u043e\u0435\u0434\u0438\u043d\u0438\u0442\u044c\u0441\u044f \u043a \u0434\u0440\u0443\u0433\u043e\u0439 \u0433\u0440\u0443\u043f\u043f\u0435"
                : "\u0422\u043e\u043b\u044c\u043a\u043e \u043e\u0442\u0434\u0435\u043b\u044c\u043d\u0430\u044f \u0433\u0440\u0443\u043f\u043f\u0430"}
            </Badge>
          </div>

          {record.request.notes ? (
            <div className="rounded-lg border border-border/70 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">
                {"\u041a\u043e\u043c\u043c\u0435\u043d\u0442\u0430\u0440\u0438\u0438"}
              </p>
              <p className="mt-1 text-sm text-foreground">{record.request.notes}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-3">
        <div className="flex items-end justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">
              {"\u041f\u0440\u0435\u0434\u043b\u043e\u0436\u0435\u043d\u0438\u044f \u0433\u0438\u0434\u043e\u0432"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {
                "\u0414\u043b\u044f \u043f\u0440\u0438\u043c\u0435\u0440\u0430 \u043f\u043e\u043a\u0430\u0437\u0430\u043d\u044b \u0441\u0433\u0435\u043d\u0435\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u044b\u0435 \u043e\u0442\u043a\u043b\u0438\u043a\u0438 \u043e\u0442 \u0433\u0438\u0434\u043e\u0432."
              }
            </p>
          </div>
          <Badge variant="outline">
            {offers.length}{" "}
            {offers.length === 1
              ? "\u043f\u0440\u0435\u0434\u043b\u043e\u0436\u0435\u043d\u0438\u0435"
              : "\u043f\u0440\u0435\u0434\u043b\u043e\u0436\u0435\u043d\u0438\u044f"}
          </Badge>
        </div>

        {offers.length === 0 ? (
          <Card className="border-border/70 bg-card/90">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">
                {"\u041f\u043e\u043a\u0430 \u043d\u0435\u0442 \u043e\u0442\u043a\u043b\u0438\u043a\u043e\u0432"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {
                  "\u0414\u043b\u044f \u0442\u043e\u043b\u044c\u043a\u043e \u0447\u0442\u043e \u0441\u043e\u0437\u0434\u0430\u043d\u043d\u044b\u0445 \u0437\u0430\u043f\u0440\u043e\u0441\u043e\u0432 \u043e\u0442\u043a\u043b\u0438\u043a\u0438 \u043f\u043e\u044f\u0432\u044f\u0442\u0441\u044f \u043f\u043e\u0437\u0436\u0435."
                }
              </p>
            </CardHeader>
          </Card>
        ) : (
          offers.map((offer) => <OfferCard key={offer.id} offer={offer} />)
        )}
      </div>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle>
            {"\u0425\u0440\u043e\u043d\u043e\u043b\u043e\u0433\u0438\u044f"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {
              "\u0427\u0442\u043e \u043f\u0440\u043e\u0438\u0441\u0445\u043e\u0434\u0438\u043b\u043e \u0441 \u044d\u0442\u0438\u043c \u0437\u0430\u043f\u0440\u043e\u0441\u043e\u043c \u043f\u043e \u0448\u0430\u0433\u0430\u043c."
            }
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet.</p>
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

function OfferCard({ offer }: { offer: TravelerOffer }) {
  return (
    <Card className="border-border/70 bg-card/90">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">{offer.guide.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {offer.guide.homeBase} {"\u00b7"} {"\u043e\u0446\u0435\u043d\u043a\u0430"}{" "}
              {offer.guide.rating.toFixed(1)} {"\u00b7"} {offer.guide.completedTrips}{" "}
              {"\u043f\u043e\u0435\u0437\u0434\u043e\u043a"}
            </p>
          </div>
          <Badge variant={offer.status === "shortlisted" ? "default" : "outline"}>
            {offer.status === "shortlisted"
              ? "\u0412 \u0438\u0437\u0431\u0440\u0430\u043d\u043d\u043e\u043c"
              : "\u0427\u0435\u0440\u043d\u043e\u0432\u0438\u043a"}
          </Badge>
        </div>

        <Separator />

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{formatRub(offer.priceTotalRub)}</Badge>
          <Badge variant="outline">
            {offer.durationDays}{" "}
            {offer.durationDays === 1
              ? "\u0434\u0435\u043d\u044c"
              : "\u0434\u043d\u0435\u0439"}
          </Badge>
          <Badge variant="outline">
            {"\u0414\u043b\u044f"} {offer.groupSizeMin}{"\u2013"}
            {offer.groupSizeMax} {"\u043f\u0443\u0442\u0435\u0448\u0435\u0441\u0442\u0432\u0435\u043d\u043d\u0438\u043a\u043e\u0432"}
          </Badge>
          <Badge variant="outline">
            {"\u041e\u0442\u0432\u0435\u0447\u0430\u0435\u0442 \u043f\u0440\u0438\u043c\u0435\u0440\u043d\u043e \u0437\u0430"}{" "}
            {offer.guide.responseTimeHours} {"\u0447"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {"\u041e\u0441\u043e\u0431\u0435\u043d\u043d\u043e\u0441\u0442\u0438"}
          </p>
          <ul className="grid gap-1 text-sm text-foreground">
            {offer.highlights.map((item) => (
              <li key={item} className="rounded-md border border-border/70 p-2">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {"\u0427\u0442\u043e \u0432\u043a\u043b\u044e\u0447\u0435\u043d\u043e"}
          </p>
          <div className="flex flex-wrap gap-2">
            {offer.included.map((item) => (
              <Badge key={item} variant="outline">
                {item}
              </Badge>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border/70 bg-background/60 p-3">
          <p className="text-xs text-muted-foreground">
            {"\u0421\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435 \u0433\u0438\u0434\u0430"}
          </p>
          <p className="mt-1 text-sm text-foreground">{offer.message}</p>
        </div>
      </CardContent>
    </Card>
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
