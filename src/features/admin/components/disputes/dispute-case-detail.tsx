import { AlertTriangle, MessageSquareText, ShieldAlert, Snowflake } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { DisputeDetail } from "@/lib/supabase/disputes";

import {
  addDisputeNoteAction,
  assignDisputeToSelfAction,
  resolveDisputeAction,
} from "@/app/(protected)/admin/disputes/[caseId]/actions";

function formatAt(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRub(minor: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

function statusBadge(status: DisputeDetail["status"]) {
  switch (status) {
    case "open":
      return { label: "Открыт", variant: "default" as const, Icon: AlertTriangle };
    case "under_review":
      return { label: "В работе", variant: "secondary" as const, Icon: ShieldAlert };
    case "resolved":
      return { label: "Решён", variant: "secondary" as const, Icon: Snowflake };
    case "closed":
      return { label: "Закрыт", variant: "outline" as const, Icon: Snowflake };
  }
}

export function DisputeCaseDetail({
  dispute,
  adminId,
}: {
  dispute: DisputeDetail;
  adminId: string;
}) {
  const badge = statusBadge(dispute.status);
  const booking = dispute.booking;
  const isAssignedToMe = dispute.assignedAdminId === adminId;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge variant="outline">Админ-панель</Badge>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Карточка спора</h1>
            <Badge variant={badge.variant}>
              <badge.Icon className="mr-1 size-3.5" />
              {badge.label}
            </Badge>
            <Badge variant="outline">{dispute.id}</Badge>
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Реальные данные спора, привязка к бронированию, заметки администраторов и итоговое решение.
          </p>
        </div>
      </div>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-lg">
                {booking?.travelerName ?? "Путешественник"} vs {booking?.guideName ?? "Гид"}
              </CardTitle>
              <CardDescription className="flex flex-wrap gap-x-2 gap-y-1">
                <span>Бронь {booking?.id ?? dispute.bookingId}</span>
                <span className="text-muted-foreground/50">·</span>
                <span>{booking?.listingTitle ?? booking?.destination ?? "Маршрут"}</span>
                <span className="text-muted-foreground/50">·</span>
                <span>{booking ? formatRub(booking.subtotalMinor) : "—"}</span>
                <span className="text-muted-foreground/50">·</span>
                <span>Статус брони: {booking?.status ?? "—"}</span>
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {dispute.payoutFrozen ? <Badge variant="destructive">Выплата заморожена</Badge> : null}
              {dispute.assignedAdminId ? (
                <Badge variant="outline">
                  Назначен: {isAssignedToMe ? "вы" : dispute.assignedAdminId}
                </Badge>
              ) : (
                <Badge variant="outline">Не назначен</Badge>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Причина</p>
              <p className="text-sm text-muted-foreground">{dispute.reason}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Запрошенный исход</p>
              <p className="text-sm text-muted-foreground">{dispute.requestedOutcome || "Не указан"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Тайминг</p>
              <p className="text-sm text-muted-foreground">Создано {formatAt(dispute.createdAt)}</p>
              <p className="text-sm text-muted-foreground">Обновлено {formatAt(dispute.updatedAt)}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-2">
            <CardTitle className="text-lg">Ход разбора</CardTitle>
            <CardDescription>
              Заметки администраторов и служебные комментарии, добавленные к спору.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dispute.notes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
                Пока нет заметок. Добавьте первый комментарий через форму справа.
              </div>
            ) : (
              dispute.notes.map((note) => (
                <article key={note.id} className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">{note.authorName}</p>
                      <p className="text-xs text-muted-foreground">{formatAt(note.createdAt)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {note.internalOnly ? <Badge variant="outline">Только внутри</Badge> : <Badge variant="secondary">Видно всем</Badge>}
                    </div>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{note.note}</p>
                </article>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/70 bg-card/90">
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg">Действия</CardTitle>
              <CardDescription>Назначить спор на себя, добавить заметку или закрыть его решением.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <form action={assignDisputeToSelfAction} className="space-y-3">
                <input type="hidden" name="case_id" value={dispute.id} />
                <input type="hidden" name="admin_id" value={adminId} />
                <Button type="submit" variant="secondary" className="w-full" disabled={isAssignedToMe && dispute.status !== "open"}>
                  {isAssignedToMe ? "Уже назначен на вас" : "Назначить себе"}
                </Button>
              </form>

              <Separator />

              <form action={addDisputeNoteAction} className="space-y-3">
                <input type="hidden" name="case_id" value={dispute.id} />
                <input type="hidden" name="author_id" value={adminId} />
                <input type="hidden" name="internal_only" value="true" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Добавить заметку</p>
                  <Textarea
                    name="note"
                    placeholder="Фиксируйте факты, ссылки на доказательства и промежуточный вывод."
                    minLength={1}
                    maxLength={4000}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  <MessageSquareText className="mr-1 size-4" />
                  Сохранить заметку
                </Button>
              </form>

              <Separator />

              <form action={resolveDisputeAction} className="space-y-3">
                <input type="hidden" name="case_id" value={dispute.id} />
                <input type="hidden" name="admin_id" value={adminId} />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Итоговое решение</p>
                  <Textarea
                    name="resolution_summary"
                    placeholder="Кратко опишите итог и что происходит с бронированием."
                    minLength={1}
                    maxLength={4000}
                    required
                  />
                </div>
                <Button type="submit" variant="secondary" className="w-full" disabled={dispute.status === "resolved"}>
                  Закрыть спор
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/90">
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg">Сводка</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Путешественник: {booking?.travelerName ?? "—"}</p>
              <p>Гид: {booking?.guideName ?? "—"}</p>
              <p>Маршрут: {booking?.listingTitle ?? booking?.destination ?? "—"}</p>
              <p>Статус спора: {dispute.status}</p>
              {dispute.resolutionSummary ? <p className="whitespace-pre-wrap">{dispute.resolutionSummary}</p> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
