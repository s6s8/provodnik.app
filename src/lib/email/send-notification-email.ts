import "server-only";
import { getResendClient } from "@/lib/email/resend-client";
import { logError } from "@/lib/log";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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
  const { error: reserveErr } = await admin
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
      logError("notifEmail.send", sendErr, {
        entityId: args.entityId,
        kind: args.kind,
        recipient: args.to,
      });
      return;
    }

    if (!data?.id) {
      logError("notifEmail.send.missingMessageId", new Error("Missing provider message id"), {
        entityId: args.entityId,
        kind: args.kind,
        recipient: args.to,
      });
      return;
    }

    const { error: markSentErr } = await admin
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
    logError("notifEmail.unexpected", e, {
      entityId: args.entityId,
      kind: args.kind,
      message,
      recipient: args.to,
    });
  }
}
