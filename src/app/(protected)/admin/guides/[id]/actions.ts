"use server";

import { revalidatePath } from "next/cache";

import {
  ensureOpenModerationCase,
  performModerationAction,
  requireAdminSession,
} from "@/lib/supabase/moderation";

export type ActionState = { error: string | null; success?: string };

function readNote(formData: FormData) {
  const value = formData.get("note");
  return typeof value === "string" ? value.trim() : "";
}

export async function approveGuide(
  guideId: string,
  _prevState: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  try {
    const { adminId } = await requireAdminSession();
    const moderationCase = await ensureOpenModerationCase({
      subjectType: "guide_profile",
      guideId,
      queueReason: "Проверка анкеты гида",
    });
    await performModerationAction(moderationCase.id, adminId, "approve");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/guides");
    revalidatePath(`/admin/guides/${guideId}`);
    revalidatePath("/guides");
    revalidatePath("/destinations");
    return { error: null, success: "Гид одобрен" };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Неизвестная ошибка при одобрении" };
  }
}

export async function rejectGuide(
  guideId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { adminId } = await requireAdminSession();
    const moderationCase = await ensureOpenModerationCase({
      subjectType: "guide_profile",
      guideId,
      queueReason: "Проверка анкеты гида",
    });
    await performModerationAction(
      moderationCase.id,
      adminId,
      "reject",
      readNote(formData),
    );
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/guides");
    revalidatePath(`/admin/guides/${guideId}`);
    return { error: null, success: "Гид отклонён" };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Неизвестная ошибка при отклонении" };
  }
}

export async function requestChanges(
  guideId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { adminId } = await requireAdminSession();
    const moderationCase = await ensureOpenModerationCase({
      subjectType: "guide_profile",
      guideId,
      queueReason: "Проверка анкеты гида",
    });
    await performModerationAction(
      moderationCase.id,
      adminId,
      "request_changes",
      readNote(formData),
    );
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/guides");
    revalidatePath(`/admin/guides/${guideId}`);
    return { error: null, success: "Запрошены правки" };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Неизвестная ошибка при запросе изменений" };
  }
}
