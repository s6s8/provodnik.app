import "server-only";

import { hasAdminRole } from "@/lib/auth/admin-access";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RequestViewerRole = "public" | "owner" | "guide" | "admin";

export async function viewerRoleForRequest(
  requestId: string,
): Promise<RequestViewerRole> {
  if (!hasSupabaseEnv()) return "public";

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return "public";

    const [requestResult, profileResult, guideProfileResult] = await Promise.all([
      supabase
        .from("traveler_requests")
        .select("traveler_id")
        .eq("id", requestId)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("guide_profiles")
        .select("verification_status")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    const travelerId =
      (requestResult.data as { traveler_id: string | null } | null)?.traveler_id ??
      null;
    if (travelerId === user.id) return "owner";

    const profileRole =
      (profileResult.data as { role: string | null } | null)?.role ?? null;
    if (
      hasAdminRole({
        profileRole,
        appMetadataRole: user.app_metadata?.role as string | undefined,
      })
    ) {
      return "admin";
    }

    const verificationStatus =
      (guideProfileResult.data as { verification_status: string | null } | null)
        ?.verification_status ?? null;
    if (verificationStatus === "approved") return "guide";

    return "public";
  } catch {
    return "public";
  }
}
