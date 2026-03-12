"use client";

import * as React from "react";
import Link from "next/link";
import {
  BadgeCheck,
  ClipboardList,
  FileText,
  Flag,
  Globe,
  Mail,
  Phone,
  ShieldCheck,
  UserCheck,
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
import { Textarea } from "@/components/ui/textarea";
import { recordMarketplaceEventFromClient } from "@/data/marketplace-events/client";

import type {
  GuideApplication,
  GuideApplicationDecision,
  GuideApplicationDocument,
  TrustSignalKey,
  VerificationState,
} from "@/features/admin/types/guide-review";

const DEFAULT_APPLICATIONS: readonly GuideApplication[] = [
  {
    id: "ga_10214",
    submittedAt: "2026-03-08T10:12:00Z",
    applicant: {
      displayName: "Elena S.",
      homeBase: "Tbilisi, GE",
      languages: ["en", "ru", "ka"],
      yearsExperience: 6,
    },
    trustSignals: {
      emailVerified: true,
      phoneVerified: true,
      identityVerified: true,
      backgroundCheck: false,
      references: true,
    },
    documents: [
      { key: "identity", label: "Identity document", state: "verified" },
      { key: "selfie", label: "Selfie match", state: "needs-review" },
      { key: "address", label: "Proof of address", state: "uploaded" },
      { key: "certification", label: "Guide certification", state: "uploaded" },
    ],
    flags: ["First-time guide profile", "High volume of edits in bio"],
    summary:
      "City walking tours focused on history and local food. Strong English, prior agency experience. Requests fast verification.",
  },
  {
    id: "ga_10221",
    submittedAt: "2026-03-09T17:44:00Z",
    applicant: {
      displayName: "Maksim P.",
      homeBase: "Almaty, KZ",
      languages: ["ru", "en"],
      yearsExperience: 2,
    },
    trustSignals: {
      emailVerified: true,
      phoneVerified: false,
      identityVerified: false,
      backgroundCheck: false,
      references: false,
    },
    documents: [
      { key: "identity", label: "Identity document", state: "missing" },
      { key: "selfie", label: "Selfie match", state: "missing" },
      { key: "address", label: "Proof of address", state: "uploaded" },
      { key: "certification", label: "Guide certification", state: "missing" },
    ],
    flags: ["Phone not verified", "Incomplete docs"],
    summary:
      "New guide application for day trips. Limited detail on itinerary and safety plan. Needs document completion.",
  },
  {
    id: "ga_10233",
    submittedAt: "2026-03-10T08:03:00Z",
    applicant: {
      displayName: "Nadia K.",
      homeBase: "Yerevan, AM",
      languages: ["en", "hy"],
      yearsExperience: 9,
    },
    trustSignals: {
      emailVerified: true,
      phoneVerified: true,
      identityVerified: true,
      backgroundCheck: true,
      references: true,
    },
    documents: [
      { key: "identity", label: "Identity document", state: "verified" },
      { key: "selfie", label: "Selfie match", state: "verified" },
      { key: "address", label: "Proof of address", state: "verified" },
      { key: "certification", label: "Guide certification", state: "verified" },
    ],
    flags: [],
    summary:
      "Experienced guide specializing in museums and family-friendly routes. Clean verification set with references and background check.",
  },
] as const;

type StatusFilter = GuideApplicationDecision | "all";

type ReviewState = Record<
  string,
  {
    decision: GuideApplicationDecision;
    note: string;
    decidedAt?: string;
  }
>;

function formatSubmittedAt(iso: string) {
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

function matchesQuery(app: GuideApplication, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    app.id,
    app.applicant.displayName,
    app.applicant.homeBase,
    app.applicant.languages.join(" "),
    app.summary,
    app.flags.join(" "),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function trustSignalLabel(key: TrustSignalKey) {
  switch (key) {
    case "emailVerified":
      return "Email";
    case "phoneVerified":
      return "Phone";
    case "identityVerified":
      return "Identity";
    case "backgroundCheck":
      return "Background";
    case "references":
      return "References";
  }
}

function trustSignalIcon(key: TrustSignalKey) {
  switch (key) {
    case "emailVerified":
      return Mail;
    case "phoneVerified":
      return Phone;
    case "identityVerified":
      return UserCheck;
    case "backgroundCheck":
      return ShieldCheck;
    case "references":
      return BadgeCheck;
  }
}

function docStateVariant(state: VerificationState): "default" | "secondary" | "destructive" | "outline" {
  switch (state) {
    case "verified":
      return "secondary";
    case "needs-review":
      return "default";
    case "uploaded":
      return "outline";
    case "missing":
      return "destructive";
    case "rejected":
      return "destructive";
  }
}

function docStateLabel(state: VerificationState) {
  switch (state) {
    case "verified":
      return "Verified";
    case "needs-review":
      return "Needs review";
    case "uploaded":
      return "Uploaded";
    case "missing":
      return "Missing";
    case "rejected":
      return "Rejected";
  }
}

function decisionBadge(decision: GuideApplicationDecision) {
  switch (decision) {
    case "pending":
      return { label: "Pending", variant: "outline" as const };
    case "approved":
      return { label: "Approved", variant: "secondary" as const };
    case "needs-more-info":
      return { label: "Needs info", variant: "default" as const };
    case "rejected":
      return { label: "Rejected", variant: "destructive" as const };
  }
}

function docCounts(documents: readonly GuideApplicationDocument[]) {
  let verified = 0;
  let needsReview = 0;
  let missing = 0;
  let other = 0;

  for (const doc of documents) {
    if (doc.state === "verified") verified += 1;
    else if (doc.state === "needs-review") needsReview += 1;
    else if (doc.state === "missing") missing += 1;
    else other += 1;
  }

  return { verified, needsReview, missing, other };
}

export function GuideReviewQueue() {
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [reviewState, setReviewState] = React.useState<ReviewState>(() => {
    const initial: ReviewState = {};
    for (const app of DEFAULT_APPLICATIONS) {
      initial[app.id] = { decision: "pending", note: "" };
    }
    return initial;
  });

  const visible = React.useMemo(() => {
    return DEFAULT_APPLICATIONS.filter((app) => {
      const state = reviewState[app.id]?.decision ?? "pending";
      if (statusFilter !== "all" && state !== statusFilter) return false;
      return matchesQuery(app, query);
    });
  }, [query, reviewState, statusFilter]);

  const counts = React.useMemo(() => {
    const all = DEFAULT_APPLICATIONS.length;
    let pending = 0;
    let approved = 0;
    let needsMoreInfo = 0;
    let rejected = 0;

    for (const app of DEFAULT_APPLICATIONS) {
      const decision = reviewState[app.id]?.decision ?? "pending";
      if (decision === "pending") pending += 1;
      else if (decision === "approved") approved += 1;
      else if (decision === "needs-more-info") needsMoreInfo += 1;
      else rejected += 1;
    }

    return { all, pending, approved, needsMoreInfo, rejected };
  }, [reviewState]);

  const setDecision = React.useCallback(
    (id: string, decision: GuideApplicationDecision, app: GuideApplication) => {
      setReviewState((prev) => ({
        ...prev,
        [id]: {
          decision,
          note: prev[id]?.note ?? "",
          decidedAt: new Date().toISOString(),
        },
      }));

      void recordMarketplaceEventFromClient({
        scope: "moderation",
        requestId: null,
        bookingId: null,
        disputeId: null,
        actorId: null,
        eventType: "guide_review_decision",
        summary: `Guide application ${id} decision set to ${decision}`,
        detail: `${app.applicant.displayName} (${app.applicant.homeBase}) decision: ${decision}`,
        payload: {
          applicationId: id,
          decision,
          applicant: app.applicant,
        },
      });
    },
    [],
  );

  const setNote = React.useCallback((id: string, note: string, app: GuideApplication) => {
    setReviewState((prev) => ({
      ...prev,
      [id]: {
        decision: prev[id]?.decision ?? "pending",
        note,
        decidedAt: prev[id]?.decidedAt,
      },
    }));

    if (!note.trim()) return;

    void recordMarketplaceEventFromClient({
      scope: "moderation",
      requestId: null,
      bookingId: null,
      disputeId: null,
      actorId: null,
      eventType: "guide_review_note",
      summary: `Guide application ${id} note updated`,
      detail: note,
      payload: {
        applicationId: id,
        applicant: app.applicant,
      },
    });
  }, []);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Badge variant="outline">Admin workspace</Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Guide review queue
              </h1>
              <p className="max-w-3xl text-base text-muted-foreground">
                Review new guide applications, verify documents, and record moderation
                decisions. This scaffold is frontend-only and keeps decisions in local
                state.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" type="button">
              <Link href="/admin/listings">
                <ClipboardList className="mr-1 size-4" />
                Listing moderation
              </Link>
            </Button>
            <Button asChild variant="outline" type="button">
              <Link href="/admin/disputes">
                <Flag className="mr-1 size-4" />
                Disputes
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
                Filter by decision status and search across applicants.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">All {counts.all}</Badge>
              <Badge variant="outline">Pending {counts.pending}</Badge>
              <Badge variant="outline">Approved {counts.approved}</Badge>
              <Badge variant="outline">Needs info {counts.needsMoreInfo}</Badge>
              <Badge variant="outline">Rejected {counts.rejected}</Badge>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="w-full md:max-w-sm">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, city, id, language, flag..."
                aria-label="Search applications"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={statusFilter === "all" ? "secondary" : "outline"}
                onClick={() => setStatusFilter("all")}
              >
                All
              </Button>
              <Button
                type="button"
                variant={statusFilter === "pending" ? "secondary" : "outline"}
                onClick={() => setStatusFilter("pending")}
              >
                Pending
              </Button>
              <Button
                type="button"
                variant={statusFilter === "needs-more-info" ? "secondary" : "outline"}
                onClick={() => setStatusFilter("needs-more-info")}
              >
                Needs info
              </Button>
              <Button
                type="button"
                variant={statusFilter === "approved" ? "secondary" : "outline"}
                onClick={() => setStatusFilter("approved")}
              >
                Approved
              </Button>
              <Button
                type="button"
                variant={statusFilter === "rejected" ? "secondary" : "outline"}
                onClick={() => setStatusFilter("rejected")}
              >
                Rejected
              </Button>
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
          visible.map((app) => {
            const state = reviewState[app.id] ?? { decision: "pending", note: "" };
            const decision = decisionBadge(state.decision);
            const expanded = expandedId === app.id;
            const docs = docCounts(app.documents);

            const trustKeys = Object.keys(app.trustSignals) as TrustSignalKey[];
            const enabledTrust = trustKeys.filter((k) => app.trustSignals[k]);

            return (
              <Card key={app.id} className="border-border/70 bg-card/90">
                <CardHeader className="gap-2 space-y-0">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-lg">
                          {app.applicant.displayName}
                        </CardTitle>
                        <Badge variant={decision.variant}>{decision.label}</Badge>
                        <Badge variant="outline">{app.id}</Badge>
                      </div>
                      <CardDescription>
                        {app.applicant.homeBase} - {app.applicant.yearsExperience}{" "}
                        yrs exp - Submitted {formatSubmittedAt(app.submittedAt)}
                      </CardDescription>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setExpandedId((prev) => (prev === app.id ? null : app.id))}
                        aria-expanded={expanded}
                      >
                        {expanded ? "Hide details" : "View details"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setDecision(app.id, "approved", app)}
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDecision(app.id, "needs-more-info", app)}
                      >
                        Request info
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setDecision(app.id, "rejected", app)}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="size-4" />
                        <span>Languages: {app.applicant.languages.join(", ")}</span>
                      </div>
                      <p className="max-w-3xl text-sm text-foreground">{app.summary}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        <FileText className="mr-1 size-3" />
                        Docs: {docs.verified} verified, {docs.needsReview} needs
                        review, {docs.missing} missing
                      </Badge>
                      <Badge variant={enabledTrust.length >= 3 ? "secondary" : "outline"}>
                        <ShieldCheck className="mr-1 size-3" />
                        Trust: {enabledTrust.length}/{trustKeys.length}
                      </Badge>
                      {app.flags.length > 0 ? (
                        <Badge variant="outline">
                          <Flag className="mr-1 size-3" />
                          Flags: {app.flags.length}
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  {expanded ? (
                    <div className="space-y-4">
                      <Separator />

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-foreground">
                            Trust signals
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {trustKeys.map((key) => {
                              const Icon = trustSignalIcon(key);
                              const enabled = app.trustSignals[key];
                              return (
                                <Badge
                                  key={key}
                                  variant={enabled ? "secondary" : "outline"}
                                >
                                  <Icon className="mr-1 size-3" />
                                  {trustSignalLabel(key)}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium text-foreground">
                            Documents
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {app.documents.map((doc) => (
                              <Badge
                                key={doc.key}
                                variant={docStateVariant(doc.state)}
                                aria-label={`${doc.label}: ${docStateLabel(doc.state)}`}
                              >
                                {doc.label}: {docStateLabel(doc.state)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      {app.flags.length > 0 ? (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-foreground">
                            Flags
                          </div>
                          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                            {app.flags.map((flag) => (
                              <li key={flag}>{flag}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      <div className="space-y-2">
                        <div className="text-sm font-medium text-foreground">
                          Decision note
                        </div>
                        <Textarea
                          value={state.note}
                          onChange={(event) => setNote(app.id, event.target.value, app)}
                          placeholder="Add rationale, missing items, or follow-ups..."
                          aria-label="Decision note"
                        />
                        <div className="text-xs text-muted-foreground">
                          Last decision: {decision.label}
                          {state.decidedAt ? ` at ${formatSubmittedAt(state.decidedAt)}` : ""}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </CardContent>

                <CardFooter className="flex flex-col items-start gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="text-xs text-muted-foreground">
                    Decisions are stored locally and reset on refresh.
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setReviewState((prev) => ({
                          ...prev,
                          [app.id]: { decision: "pending", note: "" },
                        }))
                      }
                    >
                      Reset decision
                    </Button>
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

