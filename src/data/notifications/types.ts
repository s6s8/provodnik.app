import type { NotificationKindDb } from "@/lib/supabase/types";

export type NotificationKind = NotificationKindDb;

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

