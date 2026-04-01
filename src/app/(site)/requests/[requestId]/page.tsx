import type { Metadata } from "next";
import { notFound } from "next/navigation";

import type { OpenRequestRecord } from "@/data/open-requests/types";
import { getRequestById, type RequestRecord } from "@/data/supabase/queries";
import { PublicRequestDetailScreen } from "@/features/requests/components/public/public-request-detail-screen";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isRequestMember, getRequestMembers } from "@/lib/supabase/request-members";
import { hasSupabaseEnv } from "@/lib/env";

export const metadata: Metadata = {
  title: "Детали запроса",
  description: "Подробности открытой группы путешественников.",
};

function mapToOpenRequestRecord(request: RequestRecord): OpenRequestRecord {
  return {
    id: request.id,
    status: request.status === "booked" ? "matched" : request.status === "expired" ? "closed" : "open",
    visibility: "public",
    createdAt: request.createdAt,
    updatedAt: request.createdAt,
    travelerRequestId: request.id,
    group: {
      sizeTarget: request.capacity,
      sizeCurrent: request.groupSize,
      openToMoreMembers: request.groupSize < request.capacity,
    },
    destinationLabel: request.destination,
    imageUrl: request.imageUrl,
    regionLabel: request.destinationRegion,
    dateRangeLabel: request.dateLabel,
    budgetPerPersonRub: request.budgetRub,
    highlights: [request.title, request.description, request.format].filter(Boolean) as string[],
    members: request.members,
  };
}

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  const result = await getRequestById(null as any, requestId);

  if (!result.data) notFound();

  const request = mapToOpenRequestRecord(result.data);

  // Auth context — degrade gracefully if Supabase env is not configured
  let currentUserId: string | null = null;
  let isMember = false;
  let ownerId: string | null = null;
  let serverMemberCount: number | null = null;

  if (hasSupabaseEnv()) {
    try {
      const supabase = await createSupabaseServerClient();

      // Fetch owner id and auth user in parallel
      const [userResult, ownerResult, memberResult] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from("traveler_requests")
          .select("traveler_id")
          .eq("id", requestId)
          .maybeSingle(),
        getRequestMembers(requestId),
      ]);

      currentUserId = userResult.data.user?.id ?? null;
      ownerId = (ownerResult.data as { traveler_id: string } | null)?.traveler_id ?? null;
      serverMemberCount = memberResult.length;

      if (currentUserId) {
        isMember = await isRequestMember(requestId, currentUserId);
      }
    } catch {
      // Degrade gracefully — auth or data unavailable
    }
  }

  const isOwner = ownerId !== null && currentUserId === ownerId;

  // Join button visible when:
  // - request is open
  // - user is authenticated
  // - user is not the owner/creator
  // - user is not already a member
  const showJoinButton =
    request.status === "open" &&
    currentUserId !== null &&
    !isOwner &&
    !isMember;

  const displayMemberCount = serverMemberCount ?? result.data.members.length;

  return (
    <PublicRequestDetailScreen
      request={request}
      currentUserId={currentUserId}
      isMember={isMember}
      showJoinButton={showJoinButton}
      memberCount={displayMemberCount}
    />
  );
}
