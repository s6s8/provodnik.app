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
  listDisputeCasesForAdminFromSupabase,
  saveDisputeAdminUpdateInSupabase,
} from "@/data/admin/supabase";
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
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function actorLabel(actor: DisputeTimelineActor) {
  switch (actor) {
    case "traveler":
      return "Гость";
    case "guide":
      return "Гид";
    case "system":
      return "Система";
    case "admin":
      return "Оператор";
  }
}

function eventTypeLabel(type: DisputeTimelineEventType) {
  switch (type) {
    case "opened":
      return "Создано";
    case "message":
      return "Сообщение";
    case "evidence":
      return "Доказательства";
    case "booking-update":
      return "Обновление брони";
    case "payout-freeze":
      return "Поза выплат";
    case "internal-note":
      return "Внутренняя заметка";
    case "decision":
      return "Решение";
  }
}

function severityBadge(severity: DisputeSeverity) {
  switch (severity) {
    case "low":
      return { label: "Низкий", variant: "outline" as const, Icon: Clock };
    case "medium":
      return { label: "Средний", variant: "default" as const, Icon: AlertTriangle };
    case "high":
      return { label: "Высокий", variant: "default" as const, Icon: ShieldAlert };
    case "critical":
      return { label: "Критический", variant: "destructive" as const, Icon: AlertOctagon };
  }
}

function freezeBadge(posture: PayoutFreezePosture) {
  switch (posture) {
    case "not-frozen":
      return { label: "Без блокировки", variant: "outline" as const };
    case "soft-freeze":
      return { label: "Мягкая блокировка", variant: "default" as const };
    case "hard-freeze":
      return { label: "Жёсткая блокировка", variant: "destructive" as const };
  }
}

function outcomeLabel(outcome: DisputeDecisionOutcome) {
  switch (outcome) {
    case "refund-recommended":
      return "Рекомендован полный возврат";
    case "partial-refund-recommended":
      return "Рекомендован частичный возврат";
    case "goodwill-credit-recommended":
      return "Рекомендован бонус/кредит";
    case "refund-denied":
      return "Отказать в возврате";
    case "no-action":
      return "Без действия";
  }
}

type LocalCaseState = {
  internalNotes: string;
  actionChecks: Record<string, boolean>;
  posture: PayoutFreezePosture;
  stageNote: string;
  operatorOutcome: DisputeDecisionOutcome | "unset";
};

function buildInitialLocalFromDispute(dispute?: ReturnType<typeof getDisputeCaseById> | null): LocalCaseState {
  const actionChecks: Record<string, boolean> = {};
  for (const action of dispute?.nextActions ?? []) {
    actionChecks[action.key] = false;
  }
  return {
    internalNotes: "",
    actionChecks,
    posture: dispute?.payout.posture ?? "not-frozen",
    stageNote: "",
    operatorOutcome: dispute?.recommendedOutcome ?? "unset",
  };
}

export function DisputeCaseDetail({ caseId }: { caseId: string }) {
  const [dispute, setDispute] = React.useState(() => getDisputeCaseById(caseId));
  const [backendMode, setBackendMode] = React.useState<"local" | "supabase">("local");
  const [saving, setSaving] = React.useState(false);
  const [local, setLocal] = React.useState<LocalCaseState>(() =>
    buildInitialLocalFromDispute(getDisputeCaseById(caseId)),
  );

  React.useEffect(() => {
    setDispute(getDisputeCaseById(caseId));
    setLocal(buildInitialLocalFromDispute(getDisputeCaseById(caseId)));
  }, [caseId]);

  React.useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const persisted = await listDisputeCasesForAdminFromSupabase();
        const match = persisted.find((item) => item.id === caseId);
        if (!match || ignore) return;
        setDispute(match);
        setLocal(buildInitialLocalFromDispute(match));
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
          <CardTitle className="text-lg">Спор не найден</CardTitle>
          <CardDescription>В демо‑наборе {DEFAULT_DISPUTE_CASES.length} споров.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild variant="outline" type="button">
            <Link href="/admin/disputes">Вернуться к очереди споров</Link>
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
            <Badge variant="outline">Админ‑панель</Badge>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                  Карточка спора
                </h1>
                <Badge variant="outline" className="bg-background">
                  {dispute.id}
                </Badge>
              </div>
              <p className="max-w-3xl text-base text-muted-foreground">
                Экран для работы со спором: блокировка выплат, доказательства, контекст
                политики и комментарии оператора. Платёжные действия не выполняются.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild type="button" variant="outline">
              <Link href="/admin/disputes">
                <ClipboardList className="mr-1 size-4" />
                Очередь споров
              </Link>
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/admin">
                <TimerReset className="mr-1 size-4" />
                Проверка гидов
              </Link>
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/admin/listings">
                <FileSearch className="mr-1 size-4" />
                Объявления
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
                <span>Бронь {dispute.booking.id}</span>
                <span className="text-muted-foreground/50">-</span>
                <span>{dispute.booking.routeLabel}</span>
                <span className="text-muted-foreground/50">-</span>
                <span>
                  {dispute.booking.amount.amount} {dispute.booking.amount.currency}
                </span>
                <span className="text-muted-foreground/50">-</span>
                <span>Статус брони: {dispute.booking.status}</span>
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
                Политика: {dispute.policyKey.replaceAll("-", " ")}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <div className="text-sm font-medium text-foreground">Временные метки</div>
              <div className="text-sm text-muted-foreground">
                Создано {formatAt(dispute.createdAt)}
              </div>
              <div className="text-sm text-muted-foreground">
                Обновлено {formatAt(dispute.updatedAt)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-foreground">Поза выплат</div>
              <div className="text-sm text-muted-foreground">{dispute.payout.reason}</div>
              {dispute.payout.frozenAt ? (
                <div className="text-sm text-muted-foreground">
                  Применено {formatAt(dispute.payout.frozenAt)}
                </div>
              ) : null}
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-foreground">Следующие действия</div>
              <div className="text-sm text-muted-foreground">
                {completedActions}/{dispute.nextActions.length} помечено выполненным (локально)
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">Краткое описание спора</div>
            <div className="rounded-md border border-border/70 bg-background/40 p-3 text-sm text-foreground">
              {dispute.summary}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-foreground">Хронология</div>
                <Badge variant="outline">{dispute.timeline.length} событий</Badge>
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
              <div className="text-sm font-medium text-foreground">Контекст политики</div>
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
                  <div className="text-sm font-medium text-foreground">Поза блокировки выплат</div>
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
                  {backendMode === "supabase"
                    ? "Изменяет позу выплат в записи спора (Supabase). Платёж не исполняется."
                    : "Фиксируется только локальная поза оператора; средства не блокируются."}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium text-foreground">Внутренние заметки</div>
                <Badge variant="outline">
                  <MessageSquareText className="mr-1 size-3.5" />
                  {backendMode === "supabase" ? "В базе" : "Только локально"}
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
              placeholder="Фиксируйте ссылки на доказательства, обоснование по политике и позицию коммуникации. Избегайте догадок; ссылайтесь на события и артефакты."
              aria-label="Внутренние заметки оператора"
              />
              <div className="text-xs text-muted-foreground">
                {backendMode === "supabase"
                  ? "Сохраните обновление ниже, чтобы записать заметки и состояние решения в Supabase."
                  : "В демо‑режиме заметки живут в состоянии компонента и сбрасываются при обновлении."}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground">Чек‑лист действий</div>
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
                            Ответственный: {action.owner}
                            {action.dueAt ? ` · до {formatAt(action.dueAt)}` : ""}
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant={done ? "secondary" : "outline"}
                          onClick={() => toggleAction(action.key)}
                          aria-pressed={done}
                        >
                          {done ? "Отмечено" : "Отметить выполненным"}
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
              <div className="text-sm font-medium text-foreground">Решение оператора (черновик)</div>
              <Badge variant="outline">
                <AlertTriangle className="mr-1 size-3.5" />
                Без исполнения
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={local.operatorOutcome === "unset" ? "secondary" : "outline"}
                onClick={() => setLocal((prev) => ({ ...prev, operatorOutcome: "unset" }))}
              >
                Не выбрано
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
              placeholder="Черновик обоснования и следующего шага коммуникации. Пишите по фактам, ссылайтесь на события и доказательства."
              aria-label="Черновик обоснования решения"
            />
            <div className="text-xs text-muted-foreground">
              {backendMode === "supabase"
                ? "Кнопка сохранения ниже зафиксирует решение и заметки в записи спора."
                : "В демо‑режиме это только черновик, без создания формального маршрута согласования."}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col items-start gap-2 md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-muted-foreground">
            {backendMode === "supabase"
              ? "Спор загружается из Supabase и сохраняет изменения."
              : "В демо‑режиме все изменения живут локально и не затрагивают реальные данные."}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={async () => {
                if (backendMode !== "supabase" || !dispute) return;
                try {
                  setSaving(true);
                  await saveDisputeAdminUpdateInSupabase({
                    disputeId: dispute.id,
                    posture: local.posture,
                    internalNotes: local.internalNotes,
                    stageNote: local.stageNote,
                    operatorOutcome: local.operatorOutcome,
                  });
                } catch (error) {
                  console.error("Failed to persist dispute admin update", error);
                } finally {
                  setSaving(false);
                }
              }}
              disabled={backendMode !== "supabase" || saving}
            >
              {saving ? "Сохранение..." : "Сохранить обновление"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setLocal(buildInitialLocalFromDispute(dispute));

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
              aria-label="Сбросить локальные пометки"
            >
              Сбросить черновик
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

