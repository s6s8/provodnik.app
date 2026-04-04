import "server-only";

import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
});

export type NotificationKind = NotificationKindDb;
export type CreateNotificationInput = z.infer<typeof createNotificationInputSchema>;

const NOTIFICATION_SELECT =
  "id, user_id, kind, title, body, href, is_read, created_at";

async function getNotificationWriteClient() {
  try {
    return createSupabaseAdminClient();
  } catch {
    return createSupabaseServerClient();
  }
}

export async function createNotification(
  data: CreateNotificationInput,
): Promise<NotificationRow> {
  const input = createNotificationInputSchema.parse(data);
  const supabase = await getNotificationWriteClient();

  const { data: row, error } = await supabase
    .from("notifications")
    .insert({
      user_id: input.userId,
      kind: input.kind,
      title: input.title,
      body: input.body?.trim() || null,
      href: input.href?.trim() || null,
    })
    .select(NOTIFICATION_SELECT)
    .single();

  if (error) throw error;
  return row as NotificationRow;
}
