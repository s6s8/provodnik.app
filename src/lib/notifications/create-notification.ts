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
});

export type NotificationKind = NotificationKindDb;
export type CreateNotificationInput = z.infer<typeof createNotificationInputSchema>;

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
): Promise<NotificationRow> {
  const input = createNotificationInputSchema.parse(data);
  const supabase = getNotificationWriteClient();

  const { data: row, error } = await supabase
    .from("notifications")
    .insert({
      user_id: input.userId,
      kind: input.kind,
      title: input.title,
      body: input.body?.trim() || null,
      href: input.href?.trim() || null,
      payload: input.payload ?? null,
      channel: "inbox",
      status: "unread",
    })
    .select(NOTIFICATION_SELECT)
    .single();

  if (error) throw error;
  return row as NotificationRow;
}
