"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  getTravelerRequestById,
  listOffersForTravelerRequest,
  listTimelineForTravelerRequest,
} from "@/data/traveler-request/local-store";
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

export function TravelerRequestDetailScreen({ requestId }: { requestId: string }) {
  const [record, setRecord] = React.useState<TravelerRequestRecord | null>(null);

  React.useEffect(() => {
    setRecord(getTravelerRequestById(requestId));
  }, [requestId]);

  if (!record) {
    return (
      <div className="space-y-6">
        <Badge variant="outline">Traveler workspace</Badge>
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-2">
            <CardTitle>Request not found</CardTitle>
            <p className="text-sm text-muted-foreground">
              This request ID doesn’t exist on this device.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="secondary">
              <Link href="/traveler/requests">
                <ArrowLeft className="size-4" />
                Back to requests
              </Link>
            </Button>
            <Button asChild>
              <Link href="/traveler/requests/new">
                Create a request
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const offers = listOffersForTravelerRequest(record.id);
  const timeline = listTimelineForTravelerRequest(record.id);
  const dateLabel = `${record.request.startDate} to ${record.request.endDate}`;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Button asChild variant="ghost" className="-ml-3 px-3">
            <Link href="/traveler/requests">
              <ArrowLeft className="size-4" />
              Requests
            </Link>
          </Button>
          <TravelerRequestStatusBadge status={record.status} />
        </div>

        <div className="space-y-2">
          <Badge variant="outline">Traveler workspace</Badge>
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
          <CardTitle>Request summary</CardTitle>
          <p className="text-sm text-muted-foreground">
            A structured snapshot to compare guide responses.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{record.request.experienceType}</Badge>
            <Badge variant="outline">{record.request.groupPreference}</Badge>
            <Badge variant="outline">
              Budget {formatRub(record.request.budgetPerPersonRub)} / person
            </Badge>
            <Badge variant="outline">
              {record.request.openToJoiningOthers
                ? "Open to joining others"
                : "Not joining others"}
            </Badge>
          </div>

          {record.request.notes ? (
            <div className="rounded-lg border border-border/70 bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="mt-1 text-sm text-foreground">{record.request.notes}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-3">
        <div className="flex items-end justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Offers</h2>
            <p className="text-sm text-muted-foreground">
              Seeded for demo purposes in MVP baseline.
            </p>
          </div>
          <Badge variant="outline">
            {offers.length} offer{offers.length === 1 ? "" : "s"}
          </Badge>
        </div>

        {offers.length === 0 ? (
          <Card className="border-border/70 bg-card/90">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">No offers yet</CardTitle>
              <p className="text-sm text-muted-foreground">
                Newly created local requests won’t have seeded offers.
              </p>
            </CardHeader>
          </Card>
        ) : (
          offers.map((offer) => <OfferCard key={offer.id} offer={offer} />)
        )}
      </div>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle>Timeline</CardTitle>
          <p className="text-sm text-muted-foreground">
            Activity for this request (seeded + fallback for local).
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
              {offer.guide.homeBase} · {offer.guide.rating.toFixed(1)} rating ·{" "}
              {offer.guide.completedTrips} trips
            </p>
          </div>
          <Badge variant={offer.status === "shortlisted" ? "default" : "outline"}>
            {offer.status}
          </Badge>
        </div>

        <Separator />

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{formatRub(offer.priceTotalRub)}</Badge>
          <Badge variant="outline">{offer.durationDays} days</Badge>
          <Badge variant="outline">
            For {offer.groupSizeMin}-{offer.groupSizeMax} travelers
          </Badge>
          <Badge variant="outline">
            Responds in ~{offer.guide.responseTimeHours}h
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Highlights</p>
          <ul className="grid gap-1 text-sm text-foreground">
            {offer.highlights.map((item) => (
              <li key={item} className="rounded-md border border-border/70 p-2">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Included</p>
          <div className="flex flex-wrap gap-2">
            {offer.included.map((item) => (
              <Badge key={item} variant="outline">
                {item}
              </Badge>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border/70 bg-background/60 p-3">
          <p className="text-xs text-muted-foreground">Message</p>
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

