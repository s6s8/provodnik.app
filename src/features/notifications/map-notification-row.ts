import type { NotificationRecord, NotificationSeverity } from "@/data/notifications/types";

import { isUnreadNotification } from "./components/NotificationBell";

function getSeverityForKind(kind: NotificationRecord["kind"]): NotificationSeverity {
  switch (kind) {
    case "booking_confirmed":
    case "booking_completed":
      return "success";
    case "offer_expiring":
    case "booking_cancelled":
    case "dispute_opened":
    case "admin_alert":
      return "warning";
    default:
      return "info";
  }
}

export function mapNotificationRow(row: Record<string, unknown>): NotificationRecord {
  const kind = (row.kind as NotificationRecord["kind"]) ?? "admin_alert";
  const readAt = (row.read_at as string | null) ?? null;

  return {
    id: row.id as string,
    userId: row.user_id as string,
    kind,
    severity: getSeverityForKind(kind),
    createdAt: row.created_at as string,
    readAt: isUnreadNotification({
      status: (row.status as string | null) ?? null,
      read_at: readAt,
    })
      ? null
      : readAt,
    title: row.title as string,
    body: (row.body as string) ?? "",
    href: (row.href as string) ?? undefined,
    metadata: undefined,
  };
}
