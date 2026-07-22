"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAdminAudit } from "@/lib/supabase/admin-users";
import { requireAdminSession } from "@/lib/supabase/moderation";

export type AdminRequestActionResult = {
  ok: boolean;
  message?: string;
  error?: string;
};

const requestIdSchema = z.string().uuid("Некорректный идентификатор запроса.");

const reasonSchema = z
  .string()
  .trim()
  .min(3, "Укажите причину (минимум 3 символа).")
  .max(500, "Причина не должна превышать 500 символов.");

function mapRpcError(raw: string | undefined): string {
  if (!raw) return "Не удалось выполнить действие. Попробуйте ещё раз.";
  if (raw.includes("unauthorized")) return "Недостаточно прав для этого действия.";
  if (raw.includes("request_not_found")) return "Запрос не найден или уже удалён.";
  if (raw.includes("not_blockable")) return "Заблокировать можно только открытый запрос.";
  if (raw.includes("already_blocked")) return "Запрос уже заблокирован.";
  if (raw.includes("not_blocked")) return "Запрос не заблокирован.";
  if (raw.includes("not_unblockable")) return "Разблокировать можно только изначально открытый запрос.";
  return "Не удалось выполнить действие. Попробуйте ещё раз.";
}

async function runAdminRequestRpc(
  requestId: string,
  rpc:
    | { fn: "admin_block_traveler_request"; reason: string }
    | { fn: "admin_unblock_traveler_request" }
    | { fn: "admin_delete_traveler_request"; reason: string },
  audit: { action: string; metadata?: Record<string, unknown> },
): Promise<AdminRequestActionResult> {
  const parsedId = requestIdSchema.safeParse(requestId);
  if (!parsedId.success) {
    return { ok: false, error: parsedId.error.issues[0]?.message ?? "Некорректный запрос." };
  }

  const { adminId } = await requireAdminSession();
  const supabase = await createSupabaseServerClient();

  const { error } =
    rpc.fn === "admin_unblock_traveler_request"
      ? await supabase.rpc(rpc.fn, { p_request_id: parsedId.data })
      : await supabase.rpc(rpc.fn, {
          p_request_id: parsedId.data,
          p_reason: rpc.reason,
        });

  if (error) {
    return { ok: false, error: mapRpcError(error.message) };
  }

  await logAdminAudit({
    actorId: adminId,
    action: audit.action,
    targetType: "traveler_request",
    targetId: parsedId.data,
    metadata: audit.metadata ?? {},
  });

  revalidatePath("/admin/pipeline");
  revalidatePath(`/requests/${parsedId.data}`);

  const successMessage =
    typeof audit.metadata?.successMessage === "string"
      ? audit.metadata.successMessage
      : "Действие выполнено.";

  return { ok: true, message: successMessage };
}

export async function blockTravelerRequestAction(
  requestId: string,
  reason: string,
): Promise<AdminRequestActionResult> {
  const parsedReason = reasonSchema.safeParse(reason);
  if (!parsedReason.success) {
    return { ok: false, error: parsedReason.error.issues[0]?.message ?? "Укажите причину." };
  }

  return runAdminRequestRpc(
    requestId,
    { fn: "admin_block_traveler_request", reason: parsedReason.data },
    {
      action: "request.block",
      metadata: {
        reason: parsedReason.data,
        successMessage: "Запрос заблокирован и скрыт из каталога.",
      },
    },
  );
}

export async function unblockTravelerRequestAction(
  requestId: string,
): Promise<AdminRequestActionResult> {
  return runAdminRequestRpc(
    requestId,
    { fn: "admin_unblock_traveler_request" },
    {
      action: "request.unblock",
      metadata: { successMessage: "Запрос снова открыт для присоединения и откликов." },
    },
  );
}

export async function deleteTravelerRequestAction(
  requestId: string,
  reason: string,
): Promise<AdminRequestActionResult> {
  const parsedReason = reasonSchema.safeParse(reason);
  if (!parsedReason.success) {
    return { ok: false, error: parsedReason.error.issues[0]?.message ?? "Укажите причину." };
  }

  return runAdminRequestRpc(
    requestId,
    { fn: "admin_delete_traveler_request", reason: parsedReason.data },
    {
      action: "request.delete",
      metadata: {
        reason: parsedReason.data,
        successMessage: "Запрос удалён из каталога. Подтверждённые брони сохранены.",
      },
    },
  );
}
