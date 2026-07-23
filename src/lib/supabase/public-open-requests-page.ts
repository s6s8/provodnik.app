import type { SupabaseClient } from "@supabase/supabase-js";

import type { OpenRequestRecord } from "@/data/open-requests/types";
import { resolveRequestFlexibilityPresentation } from "@/data/request-date-flexibility";
import { PUBLIC_CATALOG_PAGE_SIZE } from "@/lib/catalog-pagination";
import { cityImage } from "@/lib/city-image";
import {
  getOpenRequestsPaged,
  type RequestRecord,
} from "@/lib/supabase/queries";
import {
  getPublishedLocationCoversSafe,
  resolveLocationCover,
} from "@/lib/supabase/location-media";

export function mapToOpenRequestRecord(
  request: RequestRecord,
  viewerId: string | null,
  joinedRequestIds: Set<string>,
  covers: Map<string, string>,
): OpenRequestRecord {
  const isOwner = request.travelerId != null && request.travelerId === viewerId;
  const maskedDescription = isOwner ? request.description : "";
  const flexibility = resolveRequestFlexibilityPresentation({
    dateFlexibility: request.dateFlexibility,
    startTime: request.startTime,
    endTime: request.endTime,
  });
  return {
    id: request.id,
    isOwner,
    isMember: joinedRequestIds.has(request.id),
    status: request.status === "booked" ? "matched" : "open",
    visibility: "public",
    createdAt: request.createdAt,
    updatedAt: request.createdAt,
    travelerRequestId: request.id,
    group: {
      sizeTarget: request.groupSize,
      sizeCurrent: request.groupSize,
      openToMoreMembers: request.mode === "assembly",
    },
    destinationLabel: request.destination,
    imageUrl: request.imageUrl,
    cityImageUrl:
      resolveLocationCover(covers, request.destination) ?? cityImage(request.destination),
    regionLabel: request.destinationRegion,
    locationLabels: request.locationLabels,
    dateRangeLabel: request.dateLabel,
    datesFlexible: flexibility.datesFlexible,
    timeFlexible: flexibility.timeFlexible,
    timeLabel: flexibility.timeLabel,
    budgetPerPersonRub: request.budgetRub,
    highlights: [request.title, maskedDescription].filter(Boolean) as string[],
    interests: request.interests,
    themes: request.interests,
    notes: maskedDescription,
    organizerName: request.members[0]?.displayName ?? request.requesterName,
    members: request.members,
  };
}

export async function loadPublicOpenRequestsPage(
  supabase: SupabaseClient,
  offset = 0,
  limit = PUBLIC_CATALOG_PAGE_SIZE,
): Promise<{
  items: OpenRequestRecord[];
  hasMore: boolean;
  error: Error | null;
}> {
  const result = await getOpenRequestsPaged(supabase, { limit, offset }, ["open"]);
  if (result.error) {
    return { items: [], hasMore: false, error: result.error };
  }

  let viewerId: string | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    viewerId = data.user?.id ?? null;
  } catch {
    viewerId = null;
  }

  const joinedRequestIds = new Set<string>();
  if (viewerId && (result.data?.length ?? 0) > 0) {
    const { data: memberships } = await supabase
      .from("open_request_members")
      .select("request_id")
      .eq("traveler_id", viewerId)
      .eq("status", "joined")
      .is("left_at", null)
      .in("request_id", (result.data ?? []).map((request) => request.id));

    for (const membership of memberships ?? []) {
      if (membership.request_id) {
        joinedRequestIds.add(membership.request_id as string);
      }
    }
  }

  const covers = await getPublishedLocationCoversSafe(supabase);
  const items = (result.data ?? []).map((request) =>
    mapToOpenRequestRecord(request, viewerId, joinedRequestIds, covers),
  );

  return {
    items,
    hasMore: result.hasMore,
    error: null,
  };
}
