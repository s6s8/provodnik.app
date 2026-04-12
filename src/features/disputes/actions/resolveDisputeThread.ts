"use server";

import { flags } from "@/lib/flags";
import { resolveDispute } from "@/lib/supabase/disputes";

export async function resolveDisputeThreadAction(
  disputeId: string,
  adminId: string,
  resolutionSummary: string,
) {
  if (!flags.FEATURE_TRIPSTER_DISPUTES) throw new Error("Feature disabled");
  await resolveDispute(disputeId, adminId, resolutionSummary.trim());
}
