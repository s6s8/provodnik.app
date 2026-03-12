"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertOctagon,
  AlertTriangle,
  ClipboardList,
  Clock,
  FileSearch,
  MessageSquareText,
  ShieldAlert,
  Snowflake,
  TimerReset,
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  DEFAULT_DISPUTE_CASES,
  getDisputeCaseById,
} from "@/features/admin/components/disputes/dispute-seed";
import type {
  DisputeDecisionOutcome,
  DisputeSeverity,
  DisputeTimelineActor,
  DisputeTimelineEventType,
  PayoutFreezePosture,
} from "@/features/admin/types/disputes";
import { recordMarketplaceEventFromClient } from "@/data/marketplace-events/client";

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

function actorLabel(actor: DisputeTimelineActor) {
  switch (actor) {
    case "traveler":
      return "Traveler";
    case "guide":
      return "Guide";
    case "system":
      return "System";
    case "admin":
      return "Admin";
  }
}

function eventTypeLabel(type: DisputeTimelineEventType) {
  switch (type) {
    case "opened":
      return "Opened";
    case "message":
      return "Message";
    case "evidence":
      return "Evidence";
    case "booking-update":
      return "Booking update";
    case "payout-freeze":
      return "Payout posture";
    case "internal-note":
      return "Internal note";
    case "decision":
      return "Decision";
  }
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

function freezeBadge(posture: PayoutFreezePosture) {
  switch (posture) {
    case "not-frozen":
      return { label: "No freeze", variant: "outline" as const };
    case "soft-freeze":
      return { label: "Soft freeze", variant: "default" as const };
    case "hard-freeze":
      return { label: "Hard freeze", variant: "destructive" as const };
  }
}

function outcomeLabel(outcome: DisputeDecisionOutcome) {
  switch (outcome) {
    case "refund-recommended":
      return "Recommend refund";
    case "partial-refund-recommended":
      return "Recommend partial refund";
    case "goodwill-credit-recommended":
      return "Recommend goodwill credit";
    case "refund-denied":
      return "Deny refund";
    case "no-action":
      return "No action";
  }
}

type LocalCaseState = {
  internalNotes: string;
  actionChecks: Record<string, boolean>;
  posture: PayoutFreezePosture;
  stageNote: string;
  operatorOutcome: DisputeDecisionOutcome | "unset";
};

function buildInitialLocal(caseId: string): LocalCaseState {
  const seed = getDisputeCaseById(caseId);
  const actionChecks: Record<string, boolean> = {};
  for (const action of seed?.nextActions ?? []) {
    actionChecks[action.key] = false;
  }
  return {
    internalNotes: "",
    actionChecks,
    posture: seed?.payout.posture ?? "not-frozen",
    stageNote: "",
    operatorOutcome: seed?.recommendedOutcome ?? "unset",
  };
}

export function DisputeCaseDetail({ caseId }: { caseId: string }) {
  const dispute = React.useMemo(() => getDisputeCaseById(caseId), [caseId]);
  const [local, setLocal] = React.useState<LocalCaseState>(() => buildInitialLocal(caseId));

  React.useEffect(() => {
    setLocal(buildInitialLocal(caseId));
  }, [caseId]);

  const toggleAction = React.useCallback(
    (key: string) => {
      setLocal((prev) => ({
        ...prev,
        actionChecks: { ...prev.actionChecks, [key]: !(prev.actionChecks[key] ?? false) },
      }));

      if (!dispute) return;

      void recordMarketplaceEventFromClient({
        scope: "dispute",
        requestId: null,
        bookingId: dispute.booking.id,
        disputeId: dispute.id,
        actorId: null,
        eventType: "dispute_next_action_toggled",
        summary: `Next action ${key} toggled for dispute ${dispute.id}`,
        detail: undefined,
        payload: {
          actionKey: key,
        },
      });
    },
    [dispute],
  );

  const setPosture = React.useCallback(
    (posture: PayoutFreezePosture) => {
      setLocal((prev) => ({ ...prev, posture }));

      if (!dispute) return;

      void recordMarketplaceEventFromClient({
        scope: "dispute",
        requestId: null,
        bookingId: dispute.booking.id,
        disputeId: dispute.id,
        actorId: null,
        eventType: "dispute_payout_posture_updated",
        summary: `Payout posture updated for dispute ${dispute.id}`,
        detail: `Posture: ${posture}`,
        payload: {
          posture,
        },
      });
    },
    [dispute],
  );

  React.useEffect(() => {
    if (!dispute) return;

    void recordMarketplaceEventFromClient({
      scope: "dispute",
      requestId: null,
      bookingId: dispute.booking.id,
      disputeId: dispute.id,
      actorId: null,
      eventType: "dispute_case_viewed",
      summary: `Dispute case ${dispute.id} viewed in admin`,
      detail: `Stage: ${dispute.stage}, disposition: ${dispute.disposition}`,
      payload: {
        payoutPosture: dispute.payout.posture,
        policyKey: dispute.policyKey,
      },
    });
  }, [dispute]);

  if (!dispute) {
    return (
      <Card className="border-border/70 bg-card/90">
        <CardHeader>
          <CardTitle className="text-lg">Case not found</CardTitle>
          <CardDescription>
            This seed dataset includes {DEFAULT_DISPUTE_CASES.length} cases.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild variant="outline" type="button">
            <Link href="/admin/disputes">Back to disputes queue</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const severity = severityBadge(dispute.severity);
  const freeze = freezeBadge(local.posture);
  const completedActions = dispute.nextActions.filter(
    (action) => local.actionChecks[action.key]
  ).length;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Badge variant="outline">Admin workspace</Badge>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                  Dispute case
                </h1>
                <Badge variant="outline" className="bg-background">
                  {dispute.id}
                </Badge>
              </div>
              <p className="max-w-3xl text-base text-muted-foreground">
                This view is designed for auditability: it collects posture, evidence
                references, policy context, and operator notes. It does not execute
                refunds or payment actions.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild type="button" variant="outline">
              <Link href="/admin/disputes">
                <ClipboardList className="mr-1 size-4" />
                Disputes queue
              </Link>
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/admin">
                <TimerReset className="mr-1 size-4" />
                Guide review
              </Link>
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/admin/listings">
                <FileSearch className="mr-1 size-4" />
                Listings
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">
                {dispute.parties.travelerDisplayName} vs {dispute.parties.guideDisplayName}
              </CardTitle>
              <CardDescription className="flex flex-wrap gap-x-2 gap-y-1">
                <span>Booking {dispute.booking.id}</span>
                <span className="text-muted-foreground/50">-</span>
                <span>{dispute.booking.routeLabel}</span>
                <span className="text-muted-foreground/50">-</span>
                <span>
                  {dispute.booking.amount.amount} {dispute.booking.amount.currency}
                </span>
                <span className="text-muted-foreground/50">-</span>
                <span>Booking status: {dispute.booking.status}</span>
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={severity.variant}>
                <severity.Icon className="mr-1 size-3.5" />
                {severity.label}
              </Badge>
              <Badge variant="outline">{dispute.stage.replaceAll("-", " ")}</Badge>
              <Badge variant="outline">{dispute.disposition.replaceAll("-", " ")}</Badge>
              <Badge variant={freeze.variant}>
                <Snowflake className="mr-1 size-3.5" />
                {freeze.label}
              </Badge>
              <Badge variant="outline">
                Policy: {dispute.policyKey.replaceAll("-", " ")}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <div className="text-sm font-medium text-foreground">Case timestamps</div>
              <div className="text-sm text-muted-foreground">
                Opened {formatAt(dispute.createdAt)}
              </div>
              <div className="text-sm text-muted-foreground">
                Updated {formatAt(dispute.updatedAt)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-foreground">Payout posture</div>
              <div className="text-sm text-muted-foreground">{dispute.payout.reason}</div>
              {dispute.payout.frozenAt ? (
                <div className="text-sm text-muted-foreground">
                  Applied {formatAt(dispute.payout.frozenAt)}
                </div>
              ) : null}
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-foreground">Next actions</div>
              <div className="text-sm text-muted-foreground">
                {completedActions}/{dispute.nextActions.length} marked complete locally
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">Case summary</div>
            <div className="rounded-md border border-border/70 bg-background/40 p-3 text-sm text-foreground">
              {dispute.summary}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-foreground">Timeline</div>
                <Badge variant="outline">{dispute.timeline.length} events</Badge>
              </div>
              <div className="space-y-2">
                {dispute.timeline.map((event) => (
                  <div
                    key={`${event.at}-${event.type}-${event.summary}`}
                    className={cn(
                      "rounded-md border border-border/70 bg-background/40 p-3",
                      event.type === "payout-freeze" && "border-border",
                      event.actor === "admin" && "bg-background/55"
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{actorLabel(event.actor)}</Badge>
                        <Badge variant="outline">{eventTypeLabel(event.type)}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">{formatAt(event.at)}</div>
                    </div>
                    <div className="mt-2 text-sm font-medium text-foreground">
                      {event.summary}
                    </div>
                    {event.detail ? (
                      <div className="mt-1 text-sm text-muted-foreground">{event.detail}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium text-foreground">Policy context</div>
              <div className="space-y-2">
                {dispute.policyContext.map((note) => (
                  <div
                    key={`${note.key}-${note.title}`}
                    className="rounded-md border border-border/70 bg-background/40 p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="text-sm font-medium text-foreground">{note.title}</div>
                      <Badge variant="outline">{note.key.replaceAll("-", " ")}</Badge>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">{note.detail}</div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium text-foreground">Payout freeze posture</div>
                  <Badge variant={freeze.variant}>
                    <Snowflake className="mr-1 size-3.5" />
                    {freeze.label}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(["not-frozen", "soft-freeze", "hard-freeze"] as const).map((posture) => (
                    <Button
                      key={posture}
                      type="button"
                      size="sm"
                      variant={local.posture === posture ? "secondary" : "outline"}
                      onClick={() => setPosture(posture)}
                      aria-pressed={local.posture === posture}
                    >
                      {freezeBadge(posture).label}
                    </Button>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  This only records operator posture locally; it does not freeze funds.
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium text-foreground">Internal notes</div>
                <Badge variant="outline">
                  <MessageSquareText className="mr-1 size-3.5" />
                  Local-only
                </Badge>
              </div>
              <Textarea
                value={local.internalNotes}
                onChange={(event) => {
                  const value = event.target.value;
                  setLocal((prev) => ({ ...prev, internalNotes: value }));

                  if (!dispute || !value.trim()) return;

                  void recordMarketplaceEventFromClient({
                    scope: "dispute",
                    requestId: null,
                    bookingId: dispute.booking.id,
                    disputeId: dispute.id,
                    actorId: null,
                    eventType: "dispute_internal_note_updated",
                    summary: `Internal notes updated for dispute ${dispute.id}`,
                    detail: value,
                    payload: undefined,
                  });
                }}
                placeholder="Record evidence references, policy rationale, and communication posture. Avoid speculation; cite timestamps and artifacts."
                aria-label="Internal operator notes"
              />
              <div className="text-xs text-muted-foreground">
                Notes are stored in component state and reset on refresh.
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground">Next actions checklist</div>
              <div className="space-y-2">
                {dispute.nextActions.map((action) => {
                  const done = local.actionChecks[action.key] ?? false;
                  return (
                    <div
                      key={action.key}
                      className={cn(
                        "rounded-md border border-border/70 bg-background/40 p-3",
                        done && "opacity-80"
                      )}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-foreground">
                            {action.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Owner: {action.owner}
                            {action.dueAt ? ` · Due ${formatAt(action.dueAt)}` : ""}
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant={done ? "secondary" : "outline"}
                          onClick={() => toggleAction(action.key)}
                          aria-pressed={done}
                        >
                          {done ? "Marked done" : "Mark done"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-medium text-foreground">Operator decision (draft)</div>
              <Badge variant="outline">
                <AlertTriangle className="mr-1 size-3.5" />
                No execution
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={local.operatorOutcome === "unset" ? "secondary" : "outline"}
                onClick={() => setLocal((prev) => ({ ...prev, operatorOutcome: "unset" }))}
              >
                Unset
              </Button>
              {(
                [
                  "refund-recommended",
                  "partial-refund-recommended",
                  "refund-denied",
                  "goodwill-credit-recommended",
                  "no-action",
                ] as const
              ).map((outcome) => (
                <Button
                  key={outcome}
                  type="button"
                  size="sm"
                  variant={local.operatorOutcome === outcome ? "secondary" : "outline"}
                  onClick={() => setLocal((prev) => ({ ...prev, operatorOutcome: outcome }))}
                >
                  {outcomeLabel(outcome)}
                </Button>
              ))}
            </div>
            <Textarea
              value={local.stageNote}
              onChange={(event) => {
                const value = event.target.value;
                setLocal((prev) => ({ ...prev, stageNote: value }));

                if (!dispute || !value.trim()) return;

                void recordMarketplaceEventFromClient({
                  scope: "dispute",
                  requestId: null,
                  bookingId: dispute.booking.id,
                  disputeId: dispute.id,
                  actorId: null,
                  eventType: "dispute_decision_draft_updated",
                  summary: `Decision draft updated for dispute ${dispute.id}`,
                  detail: value,
                  payload: {
                    outcome: local.operatorOutcome,
                  },
                });
              }}
              placeholder="Draft rationale and next communication. Keep it factual and reference timeline evidence."
              aria-label="Decision draft rationale"
            />
            <div className="text-xs text-muted-foreground">
              This is a decision draft only. A real system would create an auditable
              record and route for approval.
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col items-start gap-2 md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-muted-foreground">
            All interactions here are local-first scaffolding.
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setLocal(buildInitialLocal(caseId));

              if (!dispute) return;

              void recordMarketplaceEventFromClient({
                scope: "dispute",
                requestId: null,
                bookingId: dispute.booking.id,
                disputeId: dispute.id,
                actorId: null,
                eventType: "dispute_annotations_reset",
                summary: `Local annotations reset for dispute ${dispute.id}`,
                detail: undefined,
                payload: undefined,
              });
            }}
            aria-label="Reset local annotations"
          >
            Reset local annotations
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

