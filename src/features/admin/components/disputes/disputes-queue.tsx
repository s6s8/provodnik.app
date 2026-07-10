import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { ListRow } from "@/components/shared/list-row";
import { formatRussianDateTime } from "@/lib/dates";
import { resolveDisplayName } from "@/lib/profile/resolve-display-name";
import type { DisputeListItem } from "@/lib/supabase/disputes";

type DisputeStatus = DisputeListItem["status"];

const STATUS_META: Record<DisputeStatus, { label: string; variant: "default" | "secondary" | "destructive" | "ghost" }> = {
  open: { label: "Открыт", variant: "destructive" },
  under_review: { label: "В работе", variant: "default" },
  resolved: { label: "Решён", variant: "secondary" },
  closed: { label: "Закрыт", variant: "ghost" },
};

const STATUS_ORDER: DisputeStatus[] = ["open", "under_review", "resolved", "closed"];

export function DisputesQueue({ disputes }: { disputes: DisputeListItem[] }) {
  const counts = disputes.reduce(
    (acc, item) => {
      acc[item.status] += 1;
      return acc;
    },
    { open: 0, under_review: 0, resolved: 0, closed: 0 } as Record<DisputeStatus, number>,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Споры"
        title="Споры и возвраты"
        subtitle="Управляйте открытыми спорами и возвратами."
      />

      <div className="grid gap-3 sm:grid-cols-4">
        {STATUS_ORDER.map((status) => (
          <Card key={status} size="sm">
            <CardContent className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">{STATUS_META[status].label}</span>
                {status === "open" && counts.open > 0 ? <Badge variant="destructive">Ждёт</Badge> : null}
              </div>
              <div className="text-2xl font-semibold text-foreground">{counts[status]}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {disputes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Споров нет</CardTitle>
            <CardDescription>Новые обращения появятся здесь автоматически после открытия спора.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-2">
          {disputes.map((item) => {
            const meta = STATUS_META[item.status];
            const booking = item.booking;
            const route = booking?.listingTitle ?? booking?.destination ?? "—";
            const travelerName = booking?.travelerName?.trim() || "Турист";
            const guideName = resolveDisplayName("guide", { full_name: booking?.guideName });

            return (
              <ListRow
                key={item.id}
                href={`/admin/disputes/${item.id}`}
                leading={<Badge variant={meta.variant}>{meta.label}</Badge>}
                title={`${travelerName} vs ${guideName}`}
                subtitle={`${route} · ${formatRussianDateTime(item.createdAt)}`}
                badge={<span className="font-mono text-xs text-muted-foreground">#{item.id.slice(0, 8)}</span>}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
