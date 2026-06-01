import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getResendClient } from "@/lib/email/resend-client";

const FROM = "Provodnik <noreply@provodnik.app>";
export async function sendNotificationEmail(args: {
  kind: string;
  entityId: string;
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  try {
    if (!args.to) return;
    const admin = createSupabaseAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: claimErr } = await (admin as any)
      .from("notification_email_log")
      .insert({ kind: args.kind, entity_id: args.entityId, recipient: args.to });
    if (claimErr) {
      // 23505 = unique violation = already sent → idempotent skip
      if (claimErr.code !== "23505") {
        console.error("[notif-email] claim error:", claimErr.message);
      }
      return;
    }
    const { error: sendErr } = await getResendClient().emails.send({
      from: FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
    });
    if (sendErr) console.error("[notif-email] send error:", sendErr.message);
  } catch (e) {
    console.error("[notif-email] unexpected:", e instanceof Error ? e.message : e);
  }
}
