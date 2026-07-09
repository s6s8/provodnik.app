"use server";

import { revalidatePath } from "next/cache";

import { ActionError } from "@/lib/actions/create-action";
import { createBlockInputSchema } from "@/lib/availability/blocks";
import {
  createOwnBlock,
  softDeleteOwnBlock,
} from "@/lib/supabase/guide-availability-blocks";

const GENERIC = "Не удалось сохранить. Попробуйте ещё раз.";
const COMMITMENTS_WARNING =
  "На этот период уже есть отклики или брони. Закрытие не отменяет их, но новые заявки на это время будут заблокированы.";

export type CreateBlockResult =
  | { ok: true; warning?: string }
  | { ok: false; error: string };

export async function createAvailabilityBlockAction(
  raw: unknown,
): Promise<CreateBlockResult> {
  const parsed = createBlockInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные." };
  }
  try {
    const { overlappingCommitments } = await createOwnBlock(parsed.data);
    revalidatePath("/guide/calendar");
    return overlappingCommitments > 0 ? { ok: true, warning: COMMITMENTS_WARNING } : { ok: true };
  } catch (err) {
    if (err instanceof ActionError) return { ok: false, error: err.message };
    return { ok: false, error: GENERIC };
  }
}

export async function deleteAvailabilityBlockAction(
  blockId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await softDeleteOwnBlock(blockId);
    revalidatePath("/guide/calendar");
    return { ok: true };
  } catch (err) {
    if (err instanceof ActionError) return { ok: false, error: err.message };
    return { ok: false, error: GENERIC };
  }
}
