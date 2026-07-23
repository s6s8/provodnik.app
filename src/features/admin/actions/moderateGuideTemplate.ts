"use server";

import { requireAdminSession } from "@/lib/supabase/moderation";

/** Publish a ready tour that a guide submitted for review. Service-role: RLS + the
 *  guide-template moderation trigger both permit only admin/backend to set published. */
export async function approveGuideTemplate(templateId: string) {
  const { adminClient } = await requireAdminSession();

  const { error } = await adminClient
    .from("guide_templates")
    .update({ status: "published", rejection_reason: null })
    .eq("id", templateId)
    .eq("status", "pending_review");
  if (error) throw new Error("Не удалось одобрить экскурсию.");
  return { success: true };
}

export async function rejectGuideTemplate(templateId: string, reason: string) {
  const trimmed = reason.trim();
  if (!trimmed) throw new Error("Укажите причину отклонения.");

  const { adminClient } = await requireAdminSession();

  const { error } = await adminClient
    .from("guide_templates")
    .update({ status: "rejected", rejection_reason: trimmed })
    .eq("id", templateId)
    .eq("status", "pending_review");
  if (error) throw new Error("Не удалось отклонить экскурсию.");
  return { success: true };
}
