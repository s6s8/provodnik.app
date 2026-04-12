"use server";

import crypto from "node:crypto";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function generateApiToken() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const { error } = await supabase.from("partner_accounts").upsert(
    {
      user_id: user.id,
      api_token_hash: tokenHash,
    },
    { onConflict: "user_id" },
  );

  if (error) throw new Error(error.message);

  return { token };
}
