"use server";

import { revalidatePath } from "next/cache";

import { ActionError } from "@/lib/actions/create-action";
import { setOwnAvailability } from "@/lib/supabase/availability";

const GENERIC = "Не удалось изменить статус. Попробуйте ещё раз.";

export async function setGuideAvailabilityAction(
  available: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await setOwnAvailability(available);
    revalidatePath("/guide/profile");
    revalidatePath("/guides");
    return { ok: true };
  } catch (err) {
    if (err instanceof ActionError) return { ok: false, error: err.message };
    return { ok: false, error: GENERIC };
  }
}
