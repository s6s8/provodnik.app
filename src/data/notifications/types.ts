export type NotificationKind =
  | "request_update"
  | "new_offer"
  | "booking_update"
  | "message"
  | "review_reminder"
  | "system";

export type NotificationSeverity = "info" | "success" | "warning";

export type NotificationRecord = {
  id: string;
  userId: string;
  kind: NotificationKind;
  severity: NotificationSeverity;
  createdAt: string;
  readAt: string | null;
  title: string;
  body: string;
  href?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

