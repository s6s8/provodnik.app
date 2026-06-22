import { DisputeAdminResolve } from "@/features/disputes/components/dispute-admin-resolve";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { formatRussianDateTime } from "@/lib/dates";
import { maskPii } from "@/lib/pii/mask";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CheckCircle2, Circle, Clock } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  open: "Открыт",
  under_review: "На рассмотрении",
  resolved: "Решён",
  closed: "Закрыт",
  escalated: "Эскалирован",
  investigating: "Расследование",
};

function statusBadgeClass(status: string) {
  switch (status) {
    case "open":
      return "border-warning/40 bg-warning/15 text-warning";
    case "under_review":
    case "investigating":
      return "border-primary/40 bg-primary/15 text-primary";
    case "resolved":
    case "closed":
      return "border-success/40 bg-success/15 text-success";
    case "escalated":
      return "border-destructive/40 bg-destructive/10 text-destructive";
    default:
      return "border-border/80 bg-muted/40 text-muted-foreground";
  }
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
      <p className="text-sm text-muted-foreground">Спор не найден.</p>
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
            <Badge variant="outline" className={statusBadgeClass(status)}>
              {statusLabel}
            </Badge>
            {adminView && !resolvedLike ? (
              <DisputeAdminResolve disputeId={disputeId} />
            ) : null}
          </div>
        }
      />

      {!adminView ? (
        <>
          <Alert>
            <AlertTitle>Статус</AlertTitle>
            <AlertDescription>
              Спор рассматривается администрацией. Текущий статус: {statusLabel}.
            </AlertDescription>
          </Alert>
          <Alert variant="info">
            <AlertDescription>
              Дополнение к спору временно недоступно — наша команда рассматривает вашу
              жалобу.
            </AlertDescription>
          </Alert>
        </>
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
    </div>
  );
}
