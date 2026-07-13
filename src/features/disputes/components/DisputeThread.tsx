import { DisputeAdminResolve } from "@/features/disputes/components/dispute-admin-resolve";
import { postDisputeMessage } from "@/features/disputes/dispute-message-actions";
import {
  DISPUTE_STATUS_META,
  isDisputeStatus,
  type BadgeVariant,
} from "@/features/admin/components/disputes/dispute-status-meta";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { COPY } from "@/lib/copy";
import { formatRussianDateTime } from "@/lib/dates";
import { maskPii } from "@/lib/pii/mask";
import { cn } from "@/lib/utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CheckCircle2, Circle, Clock, Flag, MessageCircle } from "lucide-react";
import Link from "next/link";

const STATUS_LABEL: Record<string, string> = {
  open: "Открыт",
  under_review: "На рассмотрении",
  resolved: "Решён",
  closed: "Закрыт",
  escalated: "Эскалирован",
  investigating: "Расследование",
};

function statusBadgeVariant(status: string): BadgeVariant {
  if (isDisputeStatus(status)) return DISPUTE_STATUS_META[status].variant;
  // Statuses outside the canonical union, still emitted by legacy rows.
  if (status === "investigating") return "info";
  if (status === "escalated") return "destructive";
  return "outline";
}

const EVENT_LABELS: Record<string, string> = {
  dispute_opened: "Спор открыт",
  admin_review: "На рассмотрении",
  resolved: "Разрешён",
  comment: "Сообщение",
};

function formatEventLabel(eventType: string | null): string {
  if (!eventType) return "Событие";
  return EVENT_LABELS[eventType] ?? eventType;
}

const COMMENT_ROLE_LABELS: Record<string, string> = {
  traveler: "Путешественник",
  guide: COPY.guide,
  admin: "Поддержка",
};

function readComment(
  payload: unknown,
): { body: string; role: string } | null {
  if (!payload || typeof payload !== "object") return null;
  const candidate = payload as { body?: unknown; role?: unknown };
  if (typeof candidate.body !== "string" || !candidate.body.trim()) return null;
  const role = typeof candidate.role === "string" ? candidate.role : "";
  return { body: candidate.body, role };
}

export async function DisputeThread({
  disputeId,
  adminView = false,
}: {
  disputeId: string;
  adminView?: boolean;
}) {
  const supabase = await createSupabaseServerClient();

  const { data: dispute, error: disputeError } = await supabase
    .from("disputes")
    .select(
      "id, booking_id, opened_by, status, resolution_summary, reason, created_at, resolved_at",
    )
    .eq("id", disputeId)
    .maybeSingle();

  if (disputeError) throw disputeError;
  if (!dispute) {
    return (
      <EmptyState
        icon={<Flag className="size-6" />}
        title="Спор не найден"
        description="Возможно, ссылка устарела или спор был закрыт."
        action={
          <Button asChild variant="outline">
            <Link href="/trips">К моим поездкам</Link>
          </Button>
        }
      />
    );
  }

  const [{ data: events, error: eventsError }, { data: bookingRow }] =
    await Promise.all([
      supabase
        .from("dispute_events")
        .select("id, event_type, payload, created_at, actor_id")
        .eq("dispute_id", disputeId)
        .order("created_at", { ascending: true }),
      supabase
        .from("bookings")
        .select(
          "id, traveler_request:traveler_requests!request_id(destination)",
        )
        .eq("id", dispute.booking_id)
        .maybeSingle(),
    ]);

  if (eventsError) throw eventsError;

  const request = Array.isArray(bookingRow?.traveler_request)
    ? bookingRow?.traveler_request[0]
    : bookingRow?.traveler_request;
  const destination =
    (request as { destination?: string | null } | null)?.destination?.trim() ||
    "Поездка";

  const status = dispute.status as string;
  const statusLabel = STATUS_LABEL[status] ?? status;
  const resolvedLike = status === "resolved" || status === "closed";

  const timeline = events ?? [];

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-6 px-[var(--px)] py-8">
      <PageHeader
        eyebrow="Спор"
        title={`Спор по бронированию · ${destination}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={statusBadgeVariant(status)}>{statusLabel}</Badge>
            {adminView && !resolvedLike ? (
              <DisputeAdminResolve disputeId={disputeId} />
            ) : null}
          </div>
        }
      />

      {!adminView ? (
        <Alert>
          <AlertTitle>Статус</AlertTitle>
          <AlertDescription>
            Спор рассматривается администрацией. Текущий статус: {statusLabel}.
          </AlertDescription>
        </Alert>
      ) : null}

      {dispute.resolution_summary ? (
        <Card className="border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle className="text-base">Решение</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-foreground">
              {dispute.resolution_summary}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Хронология
        </h2>
        {timeline.length === 0 ? (
          <EmptyState
            icon={<Clock className="size-6" />}
            title="Событий пока нет"
            description="Здесь появятся обновления по вашему спору, как только администрация начнёт рассмотрение."
          />
        ) : (
          <ol className="relative flex flex-col gap-0 border-l-2 border-border/50 pl-6">
            {timeline.map((ev, index) => {
              const isLatest = index === timeline.length - 1;
              if (ev.event_type === "comment") {
                const comment = readComment(ev.payload);
                if (!comment) return null;
                const isSupport = comment.role === "admin";
                return (
                  <li key={ev.id} className="relative pb-6 last:pb-0">
                    <span className="absolute -left-[31px] top-0 flex size-4 items-center justify-center rounded-full bg-background">
                      <MessageCircle
                        className={cn(
                          "size-4",
                          isSupport ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                    </span>
                    <div
                      className={cn(
                        "rounded-card border px-4 py-3",
                        isSupport
                          ? "border-primary/30 bg-primary-tint"
                          : "border-border/70 bg-card",
                      )}
                    >
                      <p className="text-xs font-medium text-muted-foreground">
                        {COMMENT_ROLE_LABELS[comment.role] ?? "Участник"}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                        {maskPii(comment.body)}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatRussianDateTime(ev.created_at)}
                      </p>
                    </div>
                  </li>
                );
              }
              const reason =
                ev.event_type === "dispute_opened" &&
                ev.payload &&
                typeof (ev.payload as { reason?: unknown }).reason === "string"
                  ? maskPii((ev.payload as { reason: string }).reason)
                  : null;
              return (
                <li key={ev.id} className="relative pb-6 last:pb-0">
                  <span className="absolute -left-[31px] top-0 flex size-4 items-center justify-center rounded-full bg-background">
                    {isLatest ? (
                      <Circle className="size-4 text-primary" />
                    ) : (
                      <CheckCircle2 className="size-4 text-success" />
                    )}
                  </span>
                  <p className="text-sm font-medium text-foreground">
                    {formatEventLabel(ev.event_type)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatRussianDateTime(ev.created_at)}
                  </p>
                  {reason ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                      {reason}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {resolvedLike ? (
        <Alert>
          <AlertTitle>Спор закрыт</AlertTitle>
          <AlertDescription>
            Добавить новое сообщение нельзя — спор завершён.
          </AlertDescription>
        </Alert>
      ) : (
        <form
          action={async (formData: FormData) => {
            "use server";
            await postDisputeMessage(
              disputeId,
              String(formData.get("body") ?? ""),
            );
          }}
          className="flex flex-col gap-3"
        >
          <Textarea
            name="body"
            required
            maxLength={2000}
            aria-label="Сообщение по спору"
            placeholder="Напишите сообщение второй стороне или поддержке…"
          />
          <Button type="submit" className="min-h-11 self-end">
            Отправить
          </Button>
        </form>
      )}
    </div>
  );
}
