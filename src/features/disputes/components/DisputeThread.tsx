import { DisputeAdminResolve } from "@/features/disputes/components/dispute-admin-resolve";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

function formatEventLabel(eventType: string | null) {
  if (!eventType) return "Событие";
  if (eventType === "dispute_opened") return "Спор открыт";
  return eventType;
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
      "id, booking_id, opened_by, status, resolution_summary, created_at, resolved_at",
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

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-6 px-[var(--px)] py-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Спор #{disputeId.slice(0, 8)}
        </h1>
        <Badge variant="outline" className={statusBadgeClass(status)}>
          {statusLabel}
        </Badge>
        {adminView && !resolvedLike ? (
          <DisputeAdminResolve disputeId={disputeId} />
        ) : null}
      </div>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Бронирование</CardTitle>
          <p className="text-sm text-muted-foreground">{destination}</p>
        </CardHeader>
      </Card>

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
        <Card className="border-border/70 bg-card/90">
          <CardContent className="pt-6">
            {(events ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Событий пока нет.</p>
            ) : (
              <ul className="flex flex-col gap-4">
                {(events ?? []).map((ev, i) => (
                  <li key={ev.id}>
                    {i > 0 ? <Separator className="mb-4" /> : null}
                    <p className="text-sm font-medium text-foreground">
                      {formatEventLabel(ev.event_type)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ev.created_at).toLocaleString("ru-RU")}
                    </p>
                    {ev.event_type === "dispute_opened" &&
                    ev.payload &&
                    typeof (ev.payload as { reason?: unknown }).reason ===
                      "string" ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                        {(ev.payload as { reason: string }).reason}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
