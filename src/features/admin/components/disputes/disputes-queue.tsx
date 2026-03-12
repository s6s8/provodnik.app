"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertOctagon,
  AlertTriangle,
  ClipboardList,
  Clock,
  FileSearch,
  ShieldAlert,
  Snowflake,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { DEFAULT_DISPUTE_CASES } from "@/features/admin/components/disputes/dispute-seed";
import { listDisputeCasesForAdminFromSupabase } from "@/data/admin/supabase";
import { recordMarketplaceEventFromClient } from "@/data/marketplace-events/client";
import type {
  DisputeQueueDisposition,
  DisputeSeverity,
  DisputeStage,
  PayoutFreezePosture,
} from "@/features/admin/types/disputes";

type DispositionFilter = DisputeQueueDisposition | "all";
type SeverityFilter = DisputeSeverity | "all";
type StageFilter = DisputeStage | "all";

function formatAt(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function severityBadge(severity: DisputeSeverity) {
  switch (severity) {
    case "low":
      return { label: "Low", variant: "outline" as const, Icon: Clock };
    case "medium":
      return { label: "Medium", variant: "default" as const, Icon: AlertTriangle };
    case "high":
      return { label: "High", variant: "default" as const, Icon: ShieldAlert };
    case "critical":
      return { label: "Critical", variant: "destructive" as const, Icon: AlertOctagon };
  }
}

function stageLabel(stage: DisputeStage) {
  switch (stage) {
    case "intake":
      return "Intake";
    case "investigating":
      return "Investigating";
    case "awaiting-evidence":
      return "Awaiting evidence";
    case "ready-to-decide":
      return "Ready to decide";
    case "resolved":
      return "Resolved";
  }
}

function dispositionLabel(disposition: DisputeQueueDisposition) {
  switch (disposition) {
    case "open":
      return "Open";
    case "needs-action":
      return "Needs action";
    case "waiting":
      return "Waiting";
    case "resolved":
      return "Resolved";
  }
}

function freezeLabel(posture: PayoutFreezePosture) {
  switch (posture) {
    case "not-frozen":
      return { label: "No freeze", variant: "outline" as const };
    case "soft-freeze":
      return { label: "Soft freeze", variant: "default" as const };
    case "hard-freeze":
      return { label: "Hard freeze", variant: "destructive" as const };
  }
}

function matchesQuery(query: string, item: (typeof DEFAULT_DISPUTE_CASES)[number]) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    item.id,
    item.booking.id,
    item.booking.routeLabel,
    item.booking.status,
    item.parties.travelerDisplayName,
    item.parties.guideDisplayName,
    item.severity,
    item.stage,
    item.policyKey,
    item.summary,
    item.payout.posture,
    item.payout.reason,
    item.policyContext.map((n) => `${n.title} ${n.detail}`).join(" "),
    item.timeline.map((e) => `${e.actor} ${e.type} ${e.summary} ${e.detail ?? ""}`).join(" "),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function DisputesQueue() {
  const [cases, setCases] = React.useState(() => DEFAULT_DISPUTE_CASES);
  const [backendMode, setBackendMode] = React.useState<"local" | "supabase">("local");
  const [query, setQuery] = React.useState("");
  const [dispositionFilter, setDispositionFilter] =
    React.useState<DispositionFilter>("all");
  const [severityFilter, setSeverityFilter] = React.useState<SeverityFilter>("all");
  const [stageFilter, setStageFilter] = React.useState<StageFilter>("all");

  React.useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const persisted = await listDisputeCasesForAdminFromSupabase();
        if (!persisted.length || ignore) return;
        setCases(persisted);
        setBackendMode("supabase");
      } catch {
        if (ignore) return;
        setBackendMode("local");
      }
    }

    void load();
    return () => {
      ignore = true;
    };
  }, []);

  const visible = React.useMemo(() => {
    return cases.filter((item) => {
      if (dispositionFilter !== "all" && item.disposition !== dispositionFilter)
        return false;
      if (severityFilter !== "all" && item.severity !== severityFilter) return false;
      if (stageFilter !== "all" && item.stage !== stageFilter) return false;
      return matchesQuery(query, item);
    });
  }, [cases, dispositionFilter, query, severityFilter, stageFilter]);

  const counts = React.useMemo(() => {
    const all = cases.length;
    let open = 0;
    let needsAction = 0;
    let waiting = 0;
    let resolved = 0;

    for (const item of cases) {
      if (item.disposition === "open") open += 1;
      else if (item.disposition === "needs-action") needsAction += 1;
      else if (item.disposition === "waiting") waiting += 1;
      else resolved += 1;
    }

    return { all, open, needsAction, waiting, resolved };
  }, [cases]);

  React.useEffect(() => {
    if (!visible.length) return;

    const now = new Date().toISOString();

    void recordMarketplaceEventFromClient({
      scope: "dispute",
      requestId: null,
      bookingId: null,
      disputeId: null,
      actorId: null,
      eventType: "disputes_queue_viewed",
      summary: "Admin viewed disputes queue",
      detail: `Visible cases: ${visible.length} at ${now}`,
      payload: {
        filters: {
          disposition: dispositionFilter,
          severity: severityFilter,
          stage: stageFilter,
        },
        visibleCaseIds: visible.map((item) => item.id),
      },
    });
  }, [dispositionFilter, severityFilter, stageFilter, visible]);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Badge variant="outline">Admin workspace</Badge>
            <div className="space-y-1">
              <Badge variant="outline">
                {backendMode === "supabase" ? "Supabase-backed" : "Seed fallback"}
              </Badge>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Disputes & refunds operations
              </h1>
              <p className="max-w-3xl text-base text-muted-foreground">
                Triage disputes, track payout-freeze posture, and record an audit-ready
                case narrative. When an authenticated admin session is available, this
                queue reads real Supabase dispute records. It still does not execute
                refunds or payment actions.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild type="button" variant="outline">
              <Link href="/admin">
                <ClipboardList className="mr-1 size-4" />
                Guide review
              </Link>
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/admin/listings">
                <FileSearch className="mr-1 size-4" />
                Listing moderation
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">Queue controls</CardTitle>
              <CardDescription>
                Filter the operational queue and search across case metadata and
                timeline events.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">All {counts.all}</Badge>
              <Badge variant="outline">Open {counts.open}</Badge>
              <Badge variant="outline">Needs action {counts.needsAction}</Badge>
              <Badge variant="outline">Waiting {counts.waiting}</Badge>
              <Badge variant="outline">Resolved {counts.resolved}</Badge>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="w-full md:max-w-sm">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search case id, booking, party, policy, timeline..."
                aria-label="Search dispute cases"
              />
            </div>
            <div className="flex flex-col gap-2 md:items-end">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant={dispositionFilter === "all" ? "secondary" : "outline"}
                  onClick={() => setDispositionFilter("all")}
                >
                  All
                </Button>
                <Button
                  type="button"
                  variant={dispositionFilter === "needs-action" ? "secondary" : "outline"}
                  onClick={() => setDispositionFilter("needs-action")}
                >
                  Needs action
                </Button>
                <Button
                  type="button"
                  variant={dispositionFilter === "open" ? "secondary" : "outline"}
                  onClick={() => setDispositionFilter("open")}
                >
                  Open
                </Button>
                <Button
                  type="button"
                  variant={dispositionFilter === "waiting" ? "secondary" : "outline"}
                  onClick={() => setDispositionFilter("waiting")}
                >
                  Waiting
                </Button>
                <Button
                  type="button"
                  variant={dispositionFilter === "resolved" ? "secondary" : "outline"}
                  onClick={() => setDispositionFilter("resolved")}
                >
                  Resolved
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant={severityFilter === "all" ? "secondary" : "outline"}
                  onClick={() => setSeverityFilter("all")}
                >
                  Any severity
                </Button>
                <Button
                  type="button"
                  variant={severityFilter === "medium" ? "secondary" : "outline"}
                  onClick={() => setSeverityFilter("medium")}
                >
                  Medium
                </Button>
                <Button
                  type="button"
                  variant={severityFilter === "high" ? "secondary" : "outline"}
                  onClick={() => setSeverityFilter("high")}
                >
                  High
                </Button>
                <Button
                  type="button"
                  variant={severityFilter === "critical" ? "secondary" : "outline"}
                  onClick={() => setSeverityFilter("critical")}
                >
                  Critical
                </Button>
                <Button
                  type="button"
                  variant={severityFilter === "low" ? "secondary" : "outline"}
                  onClick={() => setSeverityFilter("low")}
                >
                  Low
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant={stageFilter === "all" ? "secondary" : "outline"}
                  onClick={() => setStageFilter("all")}
                >
                  Any stage
                </Button>
                {(
                  [
                    "intake",
                    "investigating",
                    "awaiting-evidence",
                    "ready-to-decide",
                    "resolved",
                  ] as const
                ).map((stage) => (
                  <Button
                    key={stage}
                    type="button"
                    variant={stageFilter === stage ? "secondary" : "outline"}
                    onClick={() => setStageFilter(stage)}
                  >
                    {stageLabel(stage)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {visible.length === 0 ? (
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="text-lg">No results</CardTitle>
              <CardDescription>
                Try clearing filters or adjusting the search query.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          visible.map((item) => {
            const severity = severityBadge(item.severity);
            const freeze = freezeLabel(item.payout.posture);
            const lastEvent = item.timeline[item.timeline.length - 1];

            return (
              <Card key={item.id} className="border-border/70 bg-card/90">
                <CardHeader className="gap-2 space-y-0">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-lg">
                          {item.parties.travelerDisplayName} vs{" "}
                          {item.parties.guideDisplayName}
                        </CardTitle>
                        <Badge variant={severity.variant}>
                          <severity.Icon className="mr-1 size-3.5" />
                          {severity.label}
                        </Badge>
                        <Badge variant="outline">{dispositionLabel(item.disposition)}</Badge>
                        <Badge variant="outline">{stageLabel(item.stage)}</Badge>
                        <Badge variant={freeze.variant}>
                          <Snowflake className="mr-1 size-3.5" />
                          {freeze.label}
                        </Badge>
                        <Badge variant="outline">{item.id}</Badge>
                      </div>
                      <CardDescription className="flex flex-wrap gap-x-2 gap-y-1">
                        <span>Booking {item.booking.id}</span>
                        <span className="text-muted-foreground/50">-</span>
                        <span>{item.booking.routeLabel}</span>
                        <span className="text-muted-foreground/50">-</span>
                        <span>
                          {item.booking.amount.amount} {item.booking.amount.currency}
                        </span>
                        <span className="text-muted-foreground/50">-</span>
                        <span>Booking status: {item.booking.status}</span>
                      </CardDescription>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button asChild type="button" variant="secondary">
                        <Link href={`/admin/disputes/${item.id}`} aria-label={`Open ${item.id}`}>
                          Open case
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="max-w-4xl text-sm text-foreground">{item.summary}</p>

                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="text-xs text-muted-foreground">
                      Opened {formatAt(item.createdAt)} · Updated {formatAt(item.updatedAt)}
                    </div>
                    {lastEvent ? (
                      <div
                        className={cn(
                          "rounded-md border border-border/70 bg-background/40 px-3 py-2 text-xs text-muted-foreground",
                          item.disposition === "needs-action" && "border-border"
                        )}
                      >
                        <span className="font-medium text-foreground">Latest: </span>
                        {formatAt(lastEvent.at)} · {lastEvent.actor} · {lastEvent.summary}
                      </div>
                    ) : null}
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col items-start gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="text-xs text-muted-foreground">
                    Queue state is seeded; operator annotations are stored locally in the
                    case detail view.
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      <Clock className="mr-1 size-3.5" />
                      Policy: {item.policyKey.replaceAll("-", " ")}
                    </Badge>
                    <Badge variant="outline">
                      <AlertTriangle className="mr-1 size-3.5" />
                      Next actions: {item.nextActions.length}
                    </Badge>
                  </div>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

