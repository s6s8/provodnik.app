import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getResendClient } from "@/lib/email/resend-client";

const FROM = "Provodnik <noreply@provodnik.app>";

type NotificationEmailAdminClient = ReturnType<typeof createSupabaseAdminClient>;

export async function sendNotificationEmail(args: {
  kind: string;
  entityId: string;
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!args.to) return;

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

    const admin: NotificationEmailAdminClient = createSupabaseAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertErr } = await (admin as any)
      .from("notification_email_log")
      .insert({
        kind: args.kind,
        entity_id: args.entityId,
        recipient: args.to,
        sent_at: new Date().toISOString(),
      });
    if (insertErr && insertErr.code !== "23505") {
      console.error("[notif-email] log insert error:", insertErr.message);
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[notif-email] unexpected:", message);
  }
}
