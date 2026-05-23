"use server";

import { flags } from "@/lib/flags";
import { resolveDispute } from "@/lib/supabase/disputes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function resolveDisputeThreadAction(
  disputeId: string,
  resolutionSummary: string,
) {
  if (!flags.FEATURE_TR_DISPUTES) throw new Error("Feature disabled");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Verify admin role with profile fallback (AP-038)
  const jwtRole = user.user_metadata?.role ?? user.app_metadata?.role;
  if (jwtRole !== "admin") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role !== "admin") {
      throw new Error("Только администратор может разрешить спор.");
    }
  }

  await resolveDispute(disputeId, user.id, resolutionSummary.trim());
}
