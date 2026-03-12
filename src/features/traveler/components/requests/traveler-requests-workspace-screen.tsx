"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  listOffersForTravelerRequest,
  listTravelerRequests,
} from "@/data/traveler-request/local-store";
import type { TravelerRequestRecord } from "@/data/traveler-request/types";
import { TravelerRequestStatusBadge } from "@/features/traveler/components/requests/traveler-request-status";

export function TravelerRequestsWorkspaceScreen() {
  const [requests, setRequests] = React.useState<TravelerRequestRecord[]>([]);

  React.useEffect(() => {
    setRequests(listTravelerRequests());
  }, []);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Badge variant="outline">Traveler workspace</Badge>
        <div className="flex items-end justify-between gap-3">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Requests
            </h1>
            <p className="max-w-3xl text-base text-muted-foreground">
              Track active travel requests and compare seeded guide offers. New
              requests are saved locally on this device in MVP baseline.
            </p>
          </div>
          <Button asChild className="shrink-0">
            <Link href="/traveler/requests/new">
              New
              <Plus className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {requests.length === 0 ? (
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle>No requests yet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Create your first request to start receiving offers.
              </p>
              <Button asChild>
                <Link href="/traveler/requests/new">
                  Create request
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {requests.map((item) => (
              <RequestCard key={item.id} record={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RequestCard({ record }: { record: TravelerRequestRecord }) {
  const offerCount = listOffersForTravelerRequest(record.id).length;
  const dateLabel = `${record.request.startDate} to ${record.request.endDate}`;

  return (
    <Card className="border-border/70 bg-card/90">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">
              {record.request.destination}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{dateLabel}</p>
          </div>
          <TravelerRequestStatusBadge status={record.status} />
        </div>

        <Separator />

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{record.request.experienceType}</Badge>
          <Badge variant="outline">{`${record.request.groupSize} traveler${
            record.request.groupSize === 1 ? "" : "s"
          }`}</Badge>
          <Badge variant="outline">{`${offerCount} offer${
            offerCount === 1 ? "" : "s"
          }`}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Updated {formatShortDate(record.updatedAt)}
        </p>
        <Button asChild variant="secondary">
          <Link href={`/traveler/requests/${record.id}`}>
            Open
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function formatShortDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

