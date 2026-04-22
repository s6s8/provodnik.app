"use server";

import { rubToKopecks } from "@/data/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function updateRequestDetailsAction(
  requestId: string,
  updates: { budgetRub?: number; notes?: string },
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Не авторизован" };

  const { data: req } = await supabase
    .from("traveler_requests")
    .select("traveler_id")
    .eq("id", requestId)
    .maybeSingle();

  if (!req || req.traveler_id !== user.id) return { ok: false, error: "Нет доступа" };

  const patch: Record<string, unknown> = {};
  if (updates.budgetRub !== undefined) patch.budget_minor = rubToKopecks(updates.budgetRub);
  if (updates.notes !== undefined) patch.notes = updates.notes;
  if (Object.keys(patch).length === 0) return { ok: true };

  const { error } = await supabase
    .from("traveler_requests")
    .update(patch)
    .eq("id", requestId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
