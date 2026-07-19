"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // JWT fast path, then profile fallback (AP-038): seed/admin-tooling users may have
  // profiles.role = 'admin' without the JWT claim.
  if (user.app_metadata?.role === "admin") return true;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role === "admin") return true;

  throw new Error("Forbidden");
}

/** Publish a ready tour that a guide submitted for review. Service-role: RLS + the
 *  guide-template moderation trigger both permit only admin/backend to set published. */
export async function approveGuideTemplate(templateId: string) {
  const supabase = await createSupabaseServerClient();
  await verifyAdmin(supabase);

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("guide_templates")
    .update({ status: "published", rejection_reason: null })
    .eq("id", templateId)
    .eq("status", "pending_review");
  if (error) throw new Error("Не удалось одобрить экскурсию.");
  return { success: true };
}

export async function rejectGuideTemplate(templateId: string, reason: string) {
  const supabase = await createSupabaseServerClient();
  await verifyAdmin(supabase);

  const trimmed = reason.trim();
  if (!trimmed) throw new Error("Укажите причину отклонения.");

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("guide_templates")
    .update({ status: "rejected", rejection_reason: trimmed })
    .eq("id", templateId)
    .eq("status", "pending_review");
  if (error) throw new Error("Не удалось отклонить экскурсию.");
  return { success: true };
}
