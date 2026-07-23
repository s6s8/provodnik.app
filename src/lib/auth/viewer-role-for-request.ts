import "server-only";

import { cache } from "react";

import { hasAdminRole } from "@/lib/auth/admin-access";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RequestViewerRole = "public" | "owner" | "guide" | "admin";

export type RequestViewerContext = {
  role: RequestViewerRole;
  userId: string | null;
  authReadFailed: boolean;
};

export const getRequestViewerContext = cache(async (
  requestId: string,
): Promise<RequestViewerContext> => {
  if (!hasSupabaseEnv()) return { role: "public", userId: null, authReadFailed: false };

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return { role: "public", userId: null, authReadFailed: false };

    const [requestResult, profileResult, guideProfileResult] = await Promise.all([
      supabase
        .from("traveler_requests")
        .select("traveler_id, target_guide_id")
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

    const requestRow = requestResult.data as {
      traveler_id: string | null;
      target_guide_id: string | null;
    } | null;
    const travelerId = requestRow?.traveler_id ?? null;
    if (travelerId === user.id) return { role: "owner", userId: user.id, authReadFailed: false };

    const profileRole =
      (profileResult.data as { role: string | null } | null)?.role ?? null;
    if (
      hasAdminRole({
        profileRole,
        appMetadataRole: user.app_metadata?.role as string | undefined,
      })
    ) {
      return { role: "admin", userId: user.id, authReadFailed: false };
    }

    const verificationStatus =
      (guideProfileResult.data as { verification_status: string | null } | null)
        ?.verification_status ?? null;
    if (verificationStatus === "approved") {
      const targetGuideId = requestRow?.target_guide_id ?? null;
      if (!targetGuideId || targetGuideId === user.id) {
        return { role: "guide", userId: user.id, authReadFailed: false };
      }
      return { role: "public", userId: user.id, authReadFailed: false };
    }

    return { role: "public", userId: user.id, authReadFailed: false };
  } catch (error) {
    console.error("[viewer-role-for-request] auth/read failed", { requestId, error });
    return { role: "public", userId: null, authReadFailed: true };
  }
});

export async function viewerRoleForRequest(
  requestId: string,
): Promise<RequestViewerRole> {
  return (await getRequestViewerContext(requestId)).role;
}

