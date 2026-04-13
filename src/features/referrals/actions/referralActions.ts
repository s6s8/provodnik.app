"use server";

import crypto from "node:crypto";

import { flags } from "@/lib/flags";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function generateReferralCode() {
  if (!flags.FEATURE_TR_REFERRALS) throw new Error("Feature disabled");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: existing, error: existingError } = await supabase
    .from("referral_codes")
    .select("code")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return { code: existing.code };

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    const { error: insertError } = await supabase
      .from("referral_codes")
      .insert({ user_id: user.id, code });
    if (!insertError) return { code };
    if (insertError.code !== "23505") throw insertError;
  }

  throw new Error("Не удалось сгенерировать уникальный код");
}

export async function redeemReferralCode(code: string) {
  if (!flags.FEATURE_TR_REFERRALS) throw new Error("Feature disabled");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const normalized = code.trim().toUpperCase();
  if (!normalized) return { error: "Введите код" };

  const { data: referralCode, error: codeError } = await supabase
    .from("referral_codes")
    .select("id, user_id")
    .eq("code", normalized)
    .maybeSingle();
  if (codeError) throw codeError;
  if (!referralCode) return { error: "Код не найден" };
  if (referralCode.user_id === user.id) return { error: "Нельзя использовать свой код" };

  const { data: already, error: redemptionLookupError } = await supabase
    .from("referral_redemptions")
    .select("code_id")
    .eq("code_id", referralCode.id)
    .eq("redeemed_by", user.id)
    .maybeSingle();
  if (redemptionLookupError) throw redemptionLookupError;
  if (already) return { error: "Вы уже использовали реферальный код" };

  const { error: redemptionError } = await supabase.from("referral_redemptions").insert({
    code_id: referralCode.id,
    redeemed_by: user.id,
  });
  if (redemptionError) throw redemptionError;

  const { error: ledgerError } = await supabase.from("bonus_ledger").insert([
    {
      user_id: user.id,
      delta: 100,
      reason: "referral_redeemed",
      ref_id: referralCode.id,
    },
    {
      user_id: referralCode.user_id,
      delta: 100,
      reason: "referral_used",
      ref_id: referralCode.id,
    },
  ]);
  if (ledgerError) throw ledgerError;

  return { success: true as const };
}
