"use server";

import { revalidatePath } from "next/cache";

import { actionFailure } from "@/lib/errors";
import { setGuideAvailabilityByAdmin } from "@/lib/supabase/availability";
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
    return {
      error: actionFailure(err, "Не удалось одобрить гида.", "approveGuide"),
    };
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
    return {
      error: actionFailure(err, "Не удалось отклонить гида.", "rejectGuide"),
    };
  }
}

export async function setGuideAvailability(
  guideId: string,
  available: boolean,
  _prevState: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  try {
    const { adminId } = await requireAdminSession();
    await setGuideAvailabilityByAdmin(guideId, available, adminId);
    revalidatePath(`/admin/guides/${guideId}`);
    revalidatePath("/guides");
    return {
      error: null,
      success: available ? "Гид снова принимает заявки." : "Приём заявок приостановлен.",
    };
  } catch {
    return { error: "Не удалось изменить доступность гида." };
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
    return {
      error: actionFailure(err, "Не удалось запросить правки.", "requestChanges"),
    };
  }
}
