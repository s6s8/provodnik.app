import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { NotificationRow, NotificationKindDb } from "@/lib/supabase/types";
import type {
  NotificationRecord,
  NotificationSeverity,
} from "@/data/notifications/types";

const NOTIFICATION_SEVERITY_BY_KIND: Record<
  NotificationKindDb,
  NotificationSeverity
> = {
  new_offer: "info",
  offer_expiring: "warning",
  booking_created: "info",
  booking_confirmed: "success",
  booking_cancelled: "warning",
  booking_completed: "success",
  dispute_opened: "warning",
  review_requested: "info",
  admin_alert: "warning",
};

function mapRow(row: NotificationRow): NotificationRecord {
  const kindDb = row.kind;
  const severity = NOTIFICATION_SEVERITY_BY_KIND[kindDb] ?? "info";

  return {
    id: row.id,
    userId: row.user_id,
    kind: kindDb,
    severity,
    createdAt: row.created_at,
    readAt: row.is_read ? row.created_at : null,
    title: row.title,
    body: row.body ?? "",
    href: row.href ?? undefined,
    metadata: undefined,
  };
}

export async function listNotificationsForCurrentUserFromSupabase(): Promise<
  NotificationRecord[]
> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id, user_id, kind, title, body, href, is_read, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data as NotificationRow[]).map(mapRow);
}

export async function markNotificationReadInSupabase(
  notificationId: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) {
    throw error;
  }
}

