"use client";

import * as React from "react";

import {
  BadgeCheck,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  listGuideApplicationsForAdminFromSupabase,
  saveGuideReviewDecisionInSupabase,
} from "@/data/admin/supabase";
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
      homeBase: "Тбилиси, Грузия",
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
      { key: "identity", label: "Удостоверение личности", state: "verified" },
      { key: "selfie", label: "Совпадение селфи", state: "needs-review" },
      { key: "address", label: "Подтверждение адреса", state: "uploaded" },
      { key: "certification", label: "Сертификат гида", state: "uploaded" },
    ],
    flags: ["Профиль гида впервые", "Много правок в описании"],
    summary:
      "Пешеходные экскурсии по городу с акцентом на историю и локальную кухню. Хороший английский, прошлый опыт в агентстве. Просит быструю верификацию.",
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
      { key: "identity", label: "Удостоверение личности", state: "missing" },
      { key: "selfie", label: "Совпадение селфи", state: "missing" },
      { key: "address", label: "Подтверждение адреса", state: "uploaded" },
      { key: "certification", label: "Сертификат гида", state: "missing" },
    ],
    flags: ["Телефон не подтверждён", "Неполный набор документов"],
    summary:
      "Новая заявка гида на однодневные поездки. Мало деталей по маршруту и плану безопасности. Требуется дозагрузить документы.",
  },
  {
    id: "ga_10233",
    submittedAt: "2026-03-10T08:03:00Z",
    applicant: {
      displayName: "Надя К.",
      homeBase: "Ереван, Армения",
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
      { key: "identity", label: "Удостоверение личности", state: "verified" },
      { key: "selfie", label: "Совпадение селфи", state: "verified" },
      { key: "address", label: "Подтверждение адреса", state: "verified" },
      { key: "certification", label: "Сертификат гида", state: "verified" },
    ],
    flags: [],
    summary:
      "Опытный гид, специализация — музеи и семейные маршруты. Полный комплект проверки: рекомендации и проверка благонадёжности.",
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
    year: "2-digit",
    month: "2-digit",
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
      return "Почта";
    case "phoneVerified":
      return "Телефон";
    case "identityVerified":
      return "Личность";
    case "backgroundCheck":
      return "Проверка";
    case "references":
      return "Рекомендации";
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
      return "Подтверждён";
    case "needs-review":
      return "Нужна проверка";
    case "uploaded":
      return "Загружен";
    case "missing":
      return "Отсутствует";
    case "rejected":
      return "Отклонён";
  }
}

function decisionBadge(decision: GuideApplicationDecision) {
  switch (decision) {
    case "pending":
      return { label: "В очереди", variant: "outline" as const };
    case "approved":
      return { label: "Одобрено", variant: "secondary" as const };
    case "needs-more-info":
      return { label: "Нужна информация", variant: "default" as const };
    case "rejected":
      return { label: "Отклонено", variant: "destructive" as const };
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
  const [applications, setApplications] = React.useState(() => DEFAULT_APPLICATIONS);
  const [backendMode, setBackendMode] = React.useState<"local" | "supabase">("local");
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

  React.useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const persisted = await listGuideApplicationsForAdminFromSupabase();
        if (!persisted.length || ignore) return;

        setApplications(persisted);
        setReviewState(() => {
          const next: ReviewState = {};
          for (const app of persisted) {
            next[app.id] = app.reviewState;
          }
          return next;
        });
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
    return applications.filter((app) => {
      const state = reviewState[app.id]?.decision ?? "pending";
      if (statusFilter !== "all" && state !== statusFilter) return false;
      return matchesQuery(app, query);
    });
  }, [applications, query, reviewState, statusFilter]);

  const counts = React.useMemo(() => {
    const all = applications.length;
    let pending = 0;
    let approved = 0;
    let needsMoreInfo = 0;
    let rejected = 0;

    for (const app of applications) {
      const decision = reviewState[app.id]?.decision ?? "pending";
      if (decision === "pending") pending += 1;
      else if (decision === "approved") approved += 1;
      else if (decision === "needs-more-info") needsMoreInfo += 1;
      else rejected += 1;
    }

    return { all, pending, approved, needsMoreInfo, rejected };
  }, [applications, reviewState]);

  const setDecision = React.useCallback(
    async (id: string, decision: GuideApplicationDecision, app: GuideApplication) => {
      setReviewState((prev) => ({
        ...prev,
        [id]: {
          decision,
          note: prev[id]?.note ?? "",
          decidedAt: new Date().toISOString(),
        },
      }));

      if (backendMode === "supabase") {
        try {
          const nextState = await saveGuideReviewDecisionInSupabase({
            guideId: id,
            decision,
            note: reviewState[id]?.note ?? "",
          });

          setReviewState((prev) => ({
            ...prev,
            [id]: nextState,
          }));
        } catch (error) {
          console.error("Failed to persist guide review decision", error);
        }
      }

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
    [backendMode, reviewState],
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

  const filterButtons = [
    { value: "all" as const, label: `Все (${counts.all})` },
    { value: "pending" as const, label: `В очереди (${counts.pending})` },
    { value: "needs-more-info" as const, label: `Нужна инфо (${counts.needsMoreInfo})` },
    { value: "approved" as const, label: `Одобрено (${counts.approved})` },
    { value: "rejected" as const, label: `Отклонено (${counts.rejected})` },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Очередь проверки гидов</h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            Проверяйте заявки гидов, качество документов и уровень доверия. Решения
            фиксируются для аудита и управления доступом к маркетплейсу.
          </p>
        </div>
      </div>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-3">
          <div className="space-y-1">
            <CardTitle className="text-lg">Фильтры очереди</CardTitle>
            <CardDescription>
              Фильтруйте по статусу решения и ищите по ФИО, городу и языкам.
            </CardDescription>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="w-full md:max-w-sm">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Поиск по имени, городу, ID, языкам, флагам..."
                aria-label="Поиск по заявкам"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {filterButtons.map((button) => (
                <Button
                  key={button.value}
                  type="button"
                  variant={statusFilter === button.value ? "secondary" : "outline"}
                  onClick={() => setStatusFilter(button.value)}
                >
                  {button.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {backendMode === "local" ? (
        <p className="rounded-xl border border-outline-variant bg-surface-low px-4 py-3 text-xs text-on-surface-muted">
          Демо-режим: решения хранятся локально и сбрасываются при обновлении страницы.
        </p>
      ) : null}

      <div className="space-y-4">
        {visible.length === 0 ? (
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="text-lg">Ничего не найдено</CardTitle>
              <CardDescription>
                Попробуйте сбросить фильтры или изменить поисковый запрос.
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
                        <CardTitle className="text-lg">{app.applicant.displayName}</CardTitle>
                        <Badge variant={decision.variant}>{decision.label}</Badge>
                        <Badge variant="outline">{app.id}</Badge>
                      </div>
                      <CardDescription>
                        {app.applicant.homeBase} · стаж {app.applicant.yearsExperience} лет · заявка от{" "}
                        {formatSubmittedAt(app.submittedAt)}
                      </CardDescription>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setExpandedId((prev) => (prev === app.id ? null : app.id))}
                        aria-expanded={expanded}
                      >
                        {expanded ? "Свернуть" : "Показать детали"}
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => setDecision(app.id, "approved", app)}>
                        Одобрить
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setDecision(app.id, "needs-more-info", app)}>
                        Запросить инфо
                      </Button>
                      <Button type="button" variant="destructive" onClick={() => setDecision(app.id, "rejected", app)}>
                        Отклонить
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="size-4" />
                        <span>Языки: {app.applicant.languages.join(", ")}</span>
                      </div>
                      <p className="max-w-3xl text-sm text-foreground">{app.summary}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        <FileText className="mr-1 size-3" />
                        Документы: {docs.verified} подтверждено, {docs.needsReview} к проверке,{" "}
                        {docs.missing} нет
                      </Badge>
                      <Badge variant={enabledTrust.length >= 3 ? "secondary" : "outline"}>
                        <ShieldCheck className="mr-1 size-3" />
                        Доверие: {enabledTrust.length}/{trustKeys.length}
                      </Badge>
                      {app.flags.length > 0 ? (
                        <Badge variant="outline">
                          <Flag className="mr-1 size-3" />
                          Флаги: {app.flags.length}
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  {expanded ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-foreground">Сигналы доверия</div>
                          <div className="flex flex-wrap gap-2">
                            {trustKeys.map((key) => {
                              const Icon = trustSignalIcon(key);
                              const enabled = app.trustSignals[key];
                              return (
                                <Badge key={key} variant={enabled ? "secondary" : "outline"}>
                                  <Icon className="mr-1 size-3" />
                                  {trustSignalLabel(key)}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium text-foreground">Документы</div>
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
                          <div className="text-sm font-medium text-foreground">Флаги риска</div>
                          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                            {app.flags.map((flag) => (
                              <li key={flag}>{flag}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      <div className="space-y-2">
                        <div className="text-sm font-medium text-foreground">Комментарий по решению</div>
                        <Textarea
                          value={state.note}
                          onChange={(event) => setNote(app.id, event.target.value, app)}
                          placeholder="Зафиксируйте обоснование решения, недостающие данные и следующие шаги."
                          aria-label="Комментарий по решению"
                        />
                        <div className="space-y-2">
                          <div className="text-xs text-muted-foreground">
                            Последнее решение: {decision.label}
                            {state.decidedAt ? ` · ${formatSubmittedAt(state.decidedAt)}` : ""}
                          </div>
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
                            Сбросить решение
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
