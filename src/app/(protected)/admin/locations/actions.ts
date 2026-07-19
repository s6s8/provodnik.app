"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminSession } from "@/lib/supabase/moderation";
import { createLocation, setLocationStatus } from "@/lib/supabase/location-catalog";

const nameSchema = z
  .string()
  .trim()
  .min(2, "Название локации слишком короткое.")
  .max(80, "Название локации слишком длинное.");

export type LocationActionResult = { ok: true } | { ok: false; error: string };

export async function addLocationAction(name: string): Promise<LocationActionResult> {
  const { adminClient, adminId } = await requireAdminSession();
  const parsed = nameSchema.safeParse(name);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректное название." };
  }
  try {
    await createLocation(adminClient, parsed.data, adminId);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Не удалось добавить локацию.";
    // Unique index on lower(name): a duplicate is a user error, not a crash.
    if (/duplicate|unique/i.test(message)) {
      return { ok: false, error: "Такая локация уже есть в каталоге." };
    }
    return { ok: false, error: message };
  }
  revalidatePath("/admin/locations");
  return { ok: true };
}

export async function setLocationStatusAction(
  id: string,
  status: "active" | "retired",
): Promise<LocationActionResult> {
  const { adminClient } = await requireAdminSession();
  try {
    await setLocationStatus(adminClient, id, status);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Не удалось обновить локацию." };
  }
  revalidatePath("/admin/locations");
  return { ok: true };
}
