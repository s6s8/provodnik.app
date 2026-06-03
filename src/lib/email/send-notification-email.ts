import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getResendClient } from "@/lib/email/resend-client";

const FROM = "Provodnik <noreply@provodnik.app>";
const RESERVED_SENT_AT = "1970-01-01T00:00:00.000Z";

type NotificationEmailAdminClient = ReturnType<typeof createSupabaseAdminClient>;

export async function sendNotificationEmail(args: {
  kind: string;
  entityId: string;
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!args.to) return;

  const admin: NotificationEmailAdminClient = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: reserveErr } = await (admin as any)
    .from("notification_email_log")
    .insert({
      kind: args.kind,
      entity_id: args.entityId,
      recipient: args.to,
      sent_at: RESERVED_SENT_AT,
    });
  if (reserveErr) {
    if (reserveErr.code === "23505") return;
    throw new Error(`[notif-email] log reserve error: ${reserveErr.message}`);
  }

  try {
    const { data, error: sendErr } = await getResendClient().emails.send({
      from: FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
    });
    if (sendErr) {
      console.error("[notif-email] send error:", sendErr.message);
      return;
    }

    if (!data?.id) {
      console.error("[notif-email] send error: missing provider message id");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: markSentErr } = await (admin as any)
      .from("notification_email_log")
      .update({ sent_at: new Date().toISOString() })
      .match({
        kind: args.kind,
        entity_id: args.entityId,
        recipient: args.to,
      });
    if (markSentErr) {
      throw new Error(`[notif-email] log sent marker error: ${markSentErr.message}`);
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.startsWith("[notif-email] log sent marker error:")) throw e;
    console.error("[notif-email] unexpected:", message);
  }
}
