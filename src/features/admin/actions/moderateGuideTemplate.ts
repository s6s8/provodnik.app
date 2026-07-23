"use server";

import { actionFailure } from "@/lib/errors";
import { requireAdminSession } from "@/lib/supabase/moderation";

export type ModerationTemplateResult =
  | { success: true }
  | { success: false; error: string; alreadyProcessed?: boolean };

/** Publish a ready tour that a guide submitted for review. Service-role: RLS + the
 *  guide-template moderation trigger both permit only admin/backend to set published. */
export async function approveGuideTemplate(
  templateId: string,
): Promise<ModerationTemplateResult> {
  const { adminClient } = await requireAdminSession();

  const { data: updatedTemplate, error } = await adminClient
    .from("guide_templates")
    .update({ status: "published", rejection_reason: null })
    .eq("id", templateId)
    .eq("status", "pending_review")
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      success: false,
      error: actionFailure(error, "Не удалось одобрить экскурсию.", "approveGuideTemplate"),
    };
  }
  if (!updatedTemplate) {
    return {
      success: false,
      error: "Экскурсия уже обработана.",
      alreadyProcessed: true,
    };
  }
  return { success: true };
}

export async function rejectGuideTemplate(
  templateId: string,
  reason: string,
): Promise<ModerationTemplateResult> {
  const trimmed = reason.trim();
  if (!trimmed) return { success: false, error: "Укажите причину отклонения." };

  const { adminClient } = await requireAdminSession();

  const { data: updatedTemplate, error } = await adminClient
    .from("guide_templates")
    .update({ status: "rejected", rejection_reason: trimmed })
    .eq("id", templateId)
    .eq("status", "pending_review")
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      success: false,
      error: actionFailure(error, "Не удалось отклонить экскурсию.", "rejectGuideTemplate"),
    };
  }
  if (!updatedTemplate) {
    return {
      success: false,
      error: "Экскурсия уже обработана.",
      alreadyProcessed: true,
    };
  }
  return { success: true };
}
