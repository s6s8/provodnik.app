import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { getRequestById, type RequestRecord } from "@/data/supabase/queries";
import {
  type PublicRequestDetailViewModel,
  type PublicRequestJoinState,
  RequestDetailScreen,
} from "@/features/requests/components/request-detail-screen";
import { cityImage } from "@/lib/city-image";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isRequestMember } from "@/lib/supabase/request-members";
import { hasSupabaseEnv } from "@/lib/env";

const getRequestDetail = cache(async (requestId: string) => {
  const supabase = await createSupabaseServerClient();
  return getRequestById(supabase, requestId);
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ requestId: string }>;
}): Promise<Metadata> {
  const { requestId } = await params;
  const result = await getRequestDetail(requestId);

  if (!result.data || result.data.mode !== "assembly") {
    return { title: "Запрос не найден" };
  }

  return {
    title: `${result.data.destination} — ${result.data.dateLabel}`,
    description: result.data.description || "Подробности открытой группы путешественников.",
  };
}

function getTimeLabel(request: RequestRecord): string | undefined {
  if (!request.startTime) return undefined;
  return request.endTime ? `${request.startTime}–${request.endTime}` : request.startTime;
}

function getJoinState({
  request,
  currentUserId,
  isMember,
  ownerId,
}: {
  request: RequestRecord;
  currentUserId: string | null;
  isMember: boolean;
  ownerId: string | null;
}): PublicRequestJoinState {
  if (request.status !== "open") return "closed";
  if (!currentUserId) return "anon";
  if (ownerId === currentUserId) return "owner";
  if (isMember) return "member";
  return "can-join";
}

function buildViewModel({
  request,
  currentUserId,
  isMember,
  ownerId,
}: {
  request: RequestRecord;
  currentUserId: string | null;
  isMember: boolean;
  ownerId: string | null;
}): PublicRequestDetailViewModel {
  const organizerFallback = request.requesterName || "Путешественник";
  const members =
    request.members.length > 0
      ? request.members
      : [
          {
            id: `${request.id}-organizer`,
            displayName: organizerFallback,
            initials: request.requesterInitials,
            avatarUrl: request.requesterAvatarUrl ?? undefined,
          },
        ];

  return {
    title: request.title,
    regionLabel: request.destinationRegion,
    cityImageUrl: cityImage(request.destination),
    dateLabel: request.dateLabel,
    timeLabel: getTimeLabel(request),
    datesFlexible: request.dateFlexibility === "few_days",
    pricePerPersonRub: request.budgetRub > 0 ? request.budgetRub : null,
    memberCount: Math.max(request.groupSize, members.length),
    members,
    organizerName: members[0]?.displayName ?? organizerFallback,
    themes: request.interests,
    notes: request.description,
    joinState: getJoinState({ request, currentUserId, isMember, ownerId }),
  };
}

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  const result = await getRequestDetail(requestId);

  if (!result.data) notFound();
  if (result.data.mode !== "assembly") notFound();

  let currentUserId: string | null = null;
  let isMember = false;
  let ownerId: string | null = null;

  if (hasSupabaseEnv()) {
    try {
      const supabase = await createSupabaseServerClient();

      const [userResult, ownerResult] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from("traveler_requests")
          .select("traveler_id")
          .eq("id", requestId)
          .maybeSingle(),
      ]);

      currentUserId = userResult.data.user?.id ?? null;
      ownerId = (ownerResult.data as { traveler_id: string } | null)?.traveler_id ?? null;

      if (currentUserId) {
        isMember = await isRequestMember(requestId, currentUserId);
      }
    } catch {
      // Degrade gracefully — auth or data unavailable
    }
  }

  const viewModel = buildViewModel({
    request: result.data,
    currentUserId,
    isMember,
    ownerId,
  });

  return (
    <RequestDetailScreen
      viewerRole="public"
      requestId={requestId}
      viewModel={viewModel}
    />
  );
}
