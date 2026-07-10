"use server";

import { revalidatePath } from "next/cache";

import {
  bulkActionInputSchema,
  canHardDeleteUser,
  evaluateRoleChange,
  evaluateStatusChange,
  hardDeleteInputSchema,
  HARD_DELETE_CONFIRM_TEXT,
  scrubAdminReason,
  setAccountStatusInputSchema,
  setRoleInputSchema,
  type AccountStatus,
  type AdminActionResult,
  type BulkActionResult,
} from "@/data/admin-users";
import { COPY } from "@/lib/copy";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  countOtherActiveAdmins,
  getTargetForGuards,
  logAdminAudit,
} from "@/lib/supabase/admin-users";
import {
  ensureOpenModerationCase,
  performModerationAction,
  requireAdminSession,
} from "@/lib/supabase/moderation";

// GoTrue ban ≈ 100 years; "none" lifts it. Banning revokes refresh tokens so a
// suspended/archived account cannot mint new access tokens (row #35).
const BAN_FOREVER = "876000h";

async function revokeOrRestoreSession(
  adminClient: AdminClient,
  userId: string,
  status: AccountStatus,
): Promise<void> {
  await adminClient.auth.admin.updateUserById(userId, {
    ban_duration: status === "active" ? "none" : BAN_FOREVER,
  });
}

function fail(error: string): AdminActionResult {
  return { ok: false, error };
}

function ok(message: string): AdminActionResult {
  return { ok: true, message };
}

type AdminClient = Awaited<ReturnType<typeof requireAdminSession>>["adminClient"];

async function syncRoleSideEffects(input: {
  adminClient: AdminClient;
  targetId: string;
  targetEmail: string | null;
  currentRole: string;
  nextRole: string;
}) {
  if (input.nextRole === "guide") {
    const fallbackName = input.targetEmail?.split("@")[0]?.trim() || COPY.guide;
    const { error } = await input.adminClient.from("guide_profiles").upsert(
      {
        user_id: input.targetId,
        display_name: fallbackName,
        verification_status: "draft",
        is_available: false,
      },
      { onConflict: "user_id" },
    );
    if (error) throw error;
    return;
  }

  if (input.currentRole === "guide") {
    const { error } = await input.adminClient
      .from("guide_profiles")
      .update({ is_available: false })
      .eq("user_id", input.targetId);
    if (error) throw error;
  }
}

async function getGuideActionTarget(adminClient: AdminClient, guideId: string) {
  const target = await getTargetForGuards(adminClient, guideId);
  if (!target) return { ok: false as const, reason: "Пользователь не найден." };
  if (target.role !== "guide") {
    return { ok: false as const, reason: "Действие доступно только для аккаунта гида." };
  }
  if (target.accountStatus !== "active") {
    return { ok: false as const, reason: "Нельзя проверять анкету заблокированного или архивного аккаунта." };
  }

  const { data: guideProfile, error } = await adminClient
    .from("guide_profiles")
    .select("user_id, verification_status")
    .eq("user_id", guideId)
    .maybeSingle();
  if (error) throw error;
  if (!guideProfile) {
    return { ok: false as const, reason: "У пользователя нет анкеты гида." };
  }

  return { ok: true as const, target, guideProfile };
}

function revalidateUsers(userId?: string) {
  revalidatePath("/admin/users");
  if (userId) revalidatePath(`/admin/users/${userId}`);
}

function messageForRpcError(err: unknown): string {
  const raw = err instanceof Error ? err.message : "";
  if (raw.includes("last active admin")) {
    return "Нельзя заблокировать последнего активного администратора.";
  }
  if (raw.startsWith("forbidden")) return "Действие запрещено.";
  if (raw.startsWith("not_found")) return "Пользователь не найден.";
  if (raw.startsWith("noop")) return "Аккаунт уже в этом статусе.";
  return "Не удалось выполнить действие. Попробуйте ещё раз.";
}

// --- Account status --------------------------------------------------------

export async function setAccountStatusAction(
  _prev: AdminActionResult | null,
  formData: FormData,
): Promise<AdminActionResult> {
  const parsed = setAccountStatusInputSchema.safeParse({
    targetUserId: formData.get("targetUserId"),
    status: formData.get("status"),
    reason: formData.get("reason") ?? undefined,
  });
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Некорректные данные.");
  }

  try {
    const { adminId, adminClient } = await requireAdminSession();
    const target = await getTargetForGuards(adminClient, parsed.data.targetUserId);
    if (!target) return fail("Пользователь не найден.");

    const otherActiveAdminCount = await countOtherActiveAdmins(adminClient, target.id);
    const guard = evaluateStatusChange({
      currentStatus: target.accountStatus,
      nextStatus: parsed.data.status,
      isSelf: target.id === adminId,
      targetRole: target.role,
      otherActiveAdminCount,
    });
    if (!guard.ok) return fail(guard.reason);

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("admin_set_account_status", {
      p_target_user_id: parsed.data.targetUserId,
      p_status: parsed.data.status,
      p_reason: parsed.data.reason ?? undefined,
    });
    if (error) return fail(messageForRpcError(error));

    // Row #35: flipping account_status alone left the user's session valid —
    // suspension was cosmetic. Ban in GoTrue to revoke refresh tokens so no new
    // access token can be minted; clear the ban on reactivation. The proxy
    // re-checks status every request, so the already-issued access token (≤ JWT
    // TTL) is contained until it expires.
    await revokeOrRestoreSession(adminClient, target.id, parsed.data.status);

    revalidateUsers(parsed.data.targetUserId);
    return ok(statusSuccessMessage(parsed.data.status));
  } catch (err) {
    return fail(messageForRpcError(err));
  }
}

function statusSuccessMessage(status: AccountStatus): string {
  switch (status) {
    case "active":
      return "Аккаунт активирован.";
    case "suspended":
      return "Аккаунт заблокирован.";
    case "archived":
      return "Аккаунт перемещён в архив.";
  }
}

// --- Role change (keeps profiles.role and Auth app_metadata.role in sync) ---

export async function setUserRoleAction(
  _prev: AdminActionResult | null,
  formData: FormData,
): Promise<AdminActionResult> {
  const parsed = setRoleInputSchema.safeParse({
    targetUserId: formData.get("targetUserId"),
    role: formData.get("role"),
    reason: formData.get("reason") ?? undefined,
  });
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Некорректные данные.");
  }

  try {
    const { adminId, adminClient } = await requireAdminSession();
    const target = await getTargetForGuards(adminClient, parsed.data.targetUserId);
    if (!target) return fail("Пользователь не найден.");

    const otherActiveAdminCount = await countOtherActiveAdmins(adminClient, target.id);
    const guard = evaluateRoleChange({
      isSelf: target.id === adminId,
      currentRole: target.role,
      nextRole: parsed.data.role,
      otherActiveAdminCount,
    });
    if (!guard.ok) return fail(guard.reason);

    // ERR-096: role must be consistent across the JWT fast path (app_metadata)
    // AND the profiles fallback, or auth decisions disagree. Update Auth first;
    // if the profiles write then fails, revert Auth and fail honestly.
    const { error: authError } = await adminClient.auth.admin.updateUserById(target.id, {
      app_metadata: { role: parsed.data.role },
    });
    if (authError) return fail("Не удалось обновить роль в системе авторизации.");

    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ role: parsed.data.role })
      .eq("id", target.id);
    if (profileError) {
      await adminClient.auth.admin.updateUserById(target.id, {
        app_metadata: { role: target.role },
      });
      return fail("Не удалось обновить роль в профиле. Изменение отменено.");
    }

    try {
      await syncRoleSideEffects({
        adminClient,
        targetId: target.id,
        targetEmail: target.email,
        currentRole: target.role,
        nextRole: parsed.data.role,
      });
    } catch {
      await Promise.allSettled([
        adminClient.auth.admin.updateUserById(target.id, {
          app_metadata: { role: target.role },
        }),
        adminClient.from("profiles").update({ role: target.role }).eq("id", target.id),
      ]);
      return fail("Не удалось синхронизировать данные роли. Изменение отменено.");
    }

    await logAdminAudit({
      actorId: adminId,
      action: "role.change",
      targetId: target.id,
      metadata: { from: target.role, to: parsed.data.role, reason: parsed.data.reason },
    });

    revalidateUsers(target.id);
    return ok("Роль обновлена.");
  } catch {
    return fail("Не удалось изменить роль. Попробуйте ещё раз.");
  }
}

// --- Demo-only hard delete -------------------------------------------------

export async function hardDeleteDemoUserAction(
  _prev: AdminActionResult | null,
  formData: FormData,
): Promise<AdminActionResult> {
  const parsed = hardDeleteInputSchema.safeParse({
    targetUserId: formData.get("targetUserId"),
    confirmText: formData.get("confirmText"),
    reason: formData.get("reason") ?? undefined,
  });
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Некорректные данные.");
  }
  if (parsed.data.confirmText !== HARD_DELETE_CONFIRM_TEXT) {
    return fail(`Введите «${HARD_DELETE_CONFIRM_TEXT}» для подтверждения.`);
  }

  try {
    const { adminId, adminClient } = await requireAdminSession();
    if (parsed.data.targetUserId === adminId) {
      return fail("Нельзя удалить собственный аккаунт.");
    }
    const target = await getTargetForGuards(adminClient, parsed.data.targetUserId);
    if (!target) return fail("Пользователь не найден.");

    const guard = canHardDeleteUser({ email: target.email, role: target.role });
    if (!guard.ok) return fail(guard.reason);

    // Audit BEFORE deletion so the trail survives even though target_id then
    // points at a removed row (target_id has no FK, by design).
    await logAdminAudit({
      actorId: adminId,
      action: "user.hard_delete",
      targetId: target.id,
      metadata: { role: target.role, reason: parsed.data.reason },
    });

    const { error } = await adminClient.auth.admin.deleteUser(target.id);
    if (error) return fail("Не удалось удалить аккаунт.");

    revalidateUsers();
    return ok("Демо-аккаунт удалён.");
  } catch {
    return fail("Не удалось удалить аккаунт. Попробуйте ещё раз.");
  }
}

// --- Guide moderation (reuses the existing moderation pipeline) -------------

export async function approveGuideAction(
  guideId: string,
  _prev: AdminActionResult | null,
): Promise<AdminActionResult> {
  try {
    const { adminId, adminClient } = await requireAdminSession();
    const target = await getGuideActionTarget(adminClient, guideId);
    if (!target.ok) return fail(target.reason);

    const moderationCase = await ensureOpenModerationCase({
      subjectType: "guide_profile",
      guideId,
      queueReason: "Проверка анкеты гида (консоль пользователей)",
    });
    await performModerationAction(moderationCase.id, adminId, "approve");
    await logAdminAudit({ actorId: adminId, action: "guide.approve", targetId: guideId });
    revalidateUsers(guideId);
    return ok("Гид одобрен.");
  } catch {
    return fail("Не удалось одобрить гида.");
  }
}

export async function rejectGuideAction(
  guideId: string,
  _prev: AdminActionResult | null,
  formData: FormData,
): Promise<AdminActionResult> {
  const note = typeof formData.get("reason") === "string" ? scrubAdminReason((formData.get("reason") as string).trim()) : "";
  try {
    const { adminId, adminClient } = await requireAdminSession();
    const target = await getGuideActionTarget(adminClient, guideId);
    if (!target.ok) return fail(target.reason);

    const moderationCase = await ensureOpenModerationCase({
      subjectType: "guide_profile",
      guideId,
      queueReason: "Проверка анкеты гида (консоль пользователей)",
    });
    await performModerationAction(moderationCase.id, adminId, "reject", note || undefined);
    await logAdminAudit({
      actorId: adminId,
      action: "guide.reject",
      targetId: guideId,
      metadata: note ? { hasNote: true } : {},
    });
    revalidateUsers(guideId);
    return ok("Гид отклонён.");
  } catch {
    return fail("Не удалось отклонить гида.");
  }
}

// --- Bulk actions ----------------------------------------------------------

const BULK_STATUS: Record<string, AccountStatus | undefined> = {
  suspend: "suspended",
  reactivate: "active",
  archive: "archived",
};

export async function bulkAction(
  _prev: BulkActionResult | null,
  formData: FormData,
): Promise<BulkActionResult> {
  const parsed = bulkActionInputSchema.safeParse({
    action: formData.get("action"),
    userIds: formData.getAll("userIds"),
    reason: formData.get("reason") ?? undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      applied: 0,
      skipped: 0,
      message: parsed.error.issues[0]?.message ?? "Некорректные данные.",
    };
  }

  const { action, userIds, reason } = parsed.data;
  let applied = 0;
  let skipped = 0;
  const skippedReasons: string[] = [];

  try {
    const { adminId, adminClient } = await requireAdminSession();
    const supabase = await createSupabaseServerClient();

    for (const userId of userIds) {
      const target = await getTargetForGuards(adminClient, userId);
      if (!target) {
        skipped += 1;
        continue;
      }

      if (action === "approve") {
        const guideTarget = await getGuideActionTarget(adminClient, userId);
        if (!guideTarget.ok) {
          skipped += 1;
          continue;
        }
        if (guideTarget.guideProfile.verification_status === "approved") {
          skipped += 1;
          continue;
        }
        try {
          const moderationCase = await ensureOpenModerationCase({
            subjectType: "guide_profile",
            guideId: userId,
            queueReason: "Массовое одобрение гидов",
          });
          await performModerationAction(moderationCase.id, adminId, "approve");
          await logAdminAudit({ actorId: adminId, action: "guide.approve", targetId: userId });
          applied += 1;
        } catch {
          skipped += 1;
        }
        continue;
      }

      const nextStatus = BULK_STATUS[action];
      if (!nextStatus) {
        skipped += 1;
        continue;
      }
      const otherActiveAdminCount = await countOtherActiveAdmins(adminClient, target.id);
      const guard = evaluateStatusChange({
        currentStatus: target.accountStatus,
        nextStatus,
        isSelf: target.id === adminId,
        targetRole: target.role,
        otherActiveAdminCount,
      });
      if (!guard.ok) {
        skipped += 1;
        continue;
      }
      const { error } = await supabase.rpc("admin_set_account_status", {
        p_target_user_id: userId,
        p_status: nextStatus,
        p_reason: reason ?? undefined,
      });
      if (error) {
        skipped += 1;
      } else {
        // Row #35: kill/restore the session in lockstep with the status flip.
        await revokeOrRestoreSession(adminClient, userId, nextStatus);
        applied += 1;
      }
    }
  } catch {
    return {
      ok: false,
      applied,
      skipped,
      message: "Массовое действие прервано из-за ошибки.",
    };
  }

  revalidateUsers();
  if (skipped > 0) {
    skippedReasons.push(`Пропущено ${skipped}: не подходят под условие или защищены правилами.`);
  }
  return {
    ok: applied > 0,
    applied,
    skipped,
    message:
      applied > 0
        ? `Готово. Обработано: ${applied}. Пропущено: ${skipped}.`
        : "Ни один аккаунт не был изменён.",
    skippedReasons: skippedReasons.length ? skippedReasons : undefined,
  };
}
