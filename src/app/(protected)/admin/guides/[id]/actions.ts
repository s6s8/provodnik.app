"use server";

import { revalidatePath } from "next/cache";

import {
  ensureOpenModerationCase,
  performModerationAction,
  requireAdminSession,
} from "@/lib/supabase/moderation";

function readNote(formData: FormData) {
  const value = formData.get("note");
  return typeof value === "string" ? value.trim() : "";
}

export async function approveGuide(guideId: string) {
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
}

export async function rejectGuide(guideId: string, formData: FormData) {
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
}

export async function requestChanges(guideId: string, formData: FormData) {
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
}
