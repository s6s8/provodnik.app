import type { GuideVerificationStatusDb } from "@/lib/supabase/types";

/** Confirmed guide profile — moderation approved (`guide_profiles.verification_status`). */
export function isGuideProfileConfirmed(
  status: GuideVerificationStatusDb | string | null | undefined,
): boolean {
  return status === "approved";
}
