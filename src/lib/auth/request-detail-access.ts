import type { RequestViewerRole } from "@/lib/auth/viewer-role-for-request";
import type { RequestRecord } from "@/data/supabase/queries";

/**
 * Mirrors the gate on `(site)/requests/[requestId]`: assembly requests are public;
 * every other mode is visible only to the owner or an eligible guide.
 */
export function canViewRequestDetail(
  request: Pick<RequestRecord, "mode"> | null | undefined,
  viewerRole: RequestViewerRole,
): boolean {
  if (!request) return false;
  if (request.mode === "assembly") return true;
  return viewerRole === "owner" || viewerRole === "guide";
}
