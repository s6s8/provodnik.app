import { NextResponse } from "next/server";

import { canViewRequestDetail } from "@/lib/auth/request-detail-access";
import { viewerRoleForRequest } from "@/lib/auth/viewer-role-for-request";
import { getRequestById } from "@/data/supabase/queries";
import { hasSupabaseEnv } from "@/lib/env";
import { mapToOpenRequestRecord } from "@/lib/supabase/public-open-requests-page";
import { getPublishedLocationCoversSafe } from "@/lib/supabase/location-media";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ requestId: string }> },
) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Не найдено." }, { status: 404 });
  }

  const { requestId } = await context.params;
  const supabase = await createSupabaseServerClient();
  const [requestResult, viewerRole] = await Promise.all([
    getRequestById(supabase, requestId),
    viewerRoleForRequest(requestId),
  ]);

  if (!canViewRequestDetail(requestResult.data, viewerRole)) {
    return NextResponse.json({ error: "Не найдено." }, { status: 404 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewerId = user?.id ?? null;

  const joinedRequestIds = new Set<string>();
  if (viewerId) {
    const { data: membership } = await supabase
      .from("open_request_members")
      .select("request_id")
      .eq("traveler_id", viewerId)
      .eq("request_id", requestId)
      .eq("status", "joined")
      .is("left_at", null)
      .maybeSingle();

    if (membership?.request_id) {
      joinedRequestIds.add(membership.request_id as string);
    }
  }

  const covers = await getPublishedLocationCoversSafe(supabase);

  return NextResponse.json({
    item: mapToOpenRequestRecord(
      requestResult.data!,
      viewerId,
      joinedRequestIds,
      covers,
    ),
  });
}
