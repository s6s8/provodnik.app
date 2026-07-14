"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UpdateOwnPhoneResult = { ok: true } | { ok: false; error: string };

const SAVE_FAILED_MESSAGE =
  "Не удалось сохранить телефон. Обновите страницу и попробуйте снова.";

/**
 * Self-service phone fill for guides that have none (signed up before the phone
 * gate, or got the guide role via the old admin role-flip bypass). RLS
 * `profiles_update` allows a self-write as long as role/account_status are
 * unchanged — this touches only `phone`, so it goes through the user's own
 * client. The uniqueness pre-check needs the admin client: `profiles_select`
 * lets a user read only their own row.
 */
export async function updateOwnPhoneAction(phone: string): Promise<UpdateOwnPhoneResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "Требуется вход" };

  const trimmed = phone.trim();
  // Digits-only canonical form mirrors the generated `profiles.phone_normalized`
  // column (regexp_replace [^0-9]) — same rule as signUpAction.
  const normalizedPhone = trimmed.replace(/\D/g, "");
  if (!normalizedPhone || trimmed.length > 32) {
    return { ok: false, error: "Укажите корректный номер телефона" };
  }

  const admin = createSupabaseAdminClient();
  const { data: phoneOwner, error: phoneLookupError } = await admin
    .from("profiles")
    .select("id")
    .eq("phone_normalized", normalizedPhone)
    .maybeSingle();

  if (phoneLookupError) {
    console.error("[updateOwnPhoneAction] phone lookup failed:", phoneLookupError);
    return { ok: false, error: SAVE_FAILED_MESSAGE };
  }
  if (phoneOwner && phoneOwner.id !== user.id) {
    return { ok: false, error: "Этот телефон уже используется" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ phone: trimmed })
    .eq("id", user.id);

  if (error) {
    console.error("[updateOwnPhoneAction] phone update failed:", error);
    // Backstop for the race between the pre-check and the unique index.
    if (error.message?.toLowerCase().includes("phone_normalized")) {
      return { ok: false, error: "Этот телефон уже используется" };
    }
    return { ok: false, error: SAVE_FAILED_MESSAGE };
  }

  revalidatePath("/guide", "layout");
  return { ok: true };
}
