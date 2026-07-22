import "server-only";

import { z } from "zod";

import { hasSupabaseAdminEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { NotificationKindDb, NotificationRow } from "@/lib/supabase/types";

const notificationKindSchema = z.enum([
  "new_offer",
  "offer_expiring",
  "booking_created",
  "booking_confirmed",
  "booking_cancelled",
  "booking_completed",
  "dispute_opened",
  "review_requested",
  "admin_alert",
  "new_request",
]);

const createNotificationInputSchema = z.object({
  userId: z.string().uuid("Некорректный идентификатор пользователя."),
  kind: notificationKindSchema,
  title: z
    .string()
    .trim()
    .min(1, "Укажите заголовок уведомления.")
    .max(160, "Заголовок уведомления слишком длинный."),
  body: z
    .string()
    .trim()
    .max(2_000, "Текст уведомления слишком длинный.")
    .optional(),
  href: z
    .string()
    .trim()
    .min(1, "Ссылка уведомления не должна быть пустой.")
    .max(512, "Ссылка уведомления слишком длинная.")
    .optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  entityType: z.string().trim().min(1).max(64).optional(),
  entityId: z.string().uuid("Некорректный идентификатор сущности.").optional(),
});

export type NotificationKind = NotificationKindDb;
export type CreateNotificationInput = z.infer<typeof createNotificationInputSchema>;

export type CreateNotificationResult = {
  row: NotificationRow;
  /** False when a persistence-level idempotency guard already stored this notification. */
  created: boolean;
};

const NOTIFICATION_SELECT =
  "id, user_id, kind, title, body, href, channel, status, is_read, created_at, read_at, payload";

function getNotificationWriteClient() {
  if (!hasSupabaseAdminEnv()) {
    throw new Error(
      "Серверные уведомления недоступны: не настроен SUPABASE_SECRET_KEY.",
    );
  }
  return createSupabaseAdminClient();
}

export async function createNotification(
  data: CreateNotificationInput,
): Promise<CreateNotificationResult> {
  const input = createNotificationInputSchema.parse(data);
  const supabase = getNotificationWriteClient();

  const insertPayload = {
    user_id: input.userId,
    kind: input.kind,
    title: input.title,
    body: input.body?.trim() || null,
    href: input.href?.trim() || null,
    payload: input.payload ?? null,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    channel: "inbox",
    status: "unread",
  };

  const { data: row, error } = await supabase
    .from("notifications")
    .insert(insertPayload)
    .select(NOTIFICATION_SELECT)
    .single();

  if (error?.code === "23505" && input.entityId) {
    const { data: existing, error: existingError } = await supabase
      .from("notifications")
      .select(NOTIFICATION_SELECT)
      .eq("user_id", input.userId)
      .eq("kind", input.kind)
      .eq("entity_id", input.entityId)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) {
      return { row: existing as NotificationRow, created: false };
    }
  }

  if (error) throw error;
  return { row: row as NotificationRow, created: true };
}
