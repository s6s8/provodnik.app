import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { mapTravelerRequestRow } from "@/data/traveler-request/map";
import { getRequestById, type RequestRecord } from "@/data/supabase/queries";
import type { OfferMeta } from "@/features/guide/components/requests/offer-meta";
import {
  getOrCreateQaThreadAction,
  sendQaMessageAction,
} from "@/features/traveler/actions/qa-actions";
import {
  type PublicRequestDetailViewModel,
  type PublicRequestJoinState,
  RequestDetailScreen,
} from "@/features/requests/components/request-detail-screen";
import { viewerRoleForRequest } from "@/lib/auth/viewer-role-for-request";
import { cityImage } from "@/lib/city-image";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isRequestMember } from "@/lib/supabase/request-members";
import { hasSupabaseEnv } from "@/lib/env";
import { getOffersForRequest } from "@/lib/supabase/offers";
import type { QaThread } from "@/lib/supabase/qa-threads";
import { getQaMessages } from "@/lib/supabase/qa-threads";
import type {
  GuideOfferRow,
  TravelerRequestRow,
} from "@/lib/supabase/types";

const getRequestDetail = cache(async (requestId: string) => {
  const supabase = await createSupabaseServerClient();
  return getRequestById(supabase, requestId);
});

const travelerRequestSelect =
  "id, traveler_id, destination, region, interests, starts_on, ends_on, start_time, end_time, budget_minor, currency, participants_count, format_preference, notes, open_to_join, allow_guide_suggestions, group_capacity, status, created_at, updated_at, date_locked, time_locked, count_locked, budget_locked, date_window";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ requestId: string }>;
}): Promise<Metadata> {
  const { requestId } = await params;
  const result = await getRequestDetail(requestId);

  if (!result.data) {
    return {
      title: "Запрос не найден",
      alternates: { canonical: `/requests/${requestId}` },
    };
  }

  if (result.data.mode !== "assembly") {
    const viewerRole = await viewerRoleForRequest(requestId);
    if (viewerRole !== "owner" && viewerRole !== "guide") {
      return {
        title: "Запрос не найден",
        alternates: { canonical: `/requests/${requestId}` },
      };
    }
  }

  return {
    title: `${result.data.destination} — ${result.data.dateLabel}`,
    description: result.data.description || "Подробности открытой группы путешественников.",
    alternates: { canonical: `/requests/${requestId}` },
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

async function getOwnerDetailData(requestId: string, currentUserId: string | null) {
  if (!currentUserId) notFound();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("traveler_requests")
    .select(travelerRequestSelect)
    .eq("id", requestId)
    .eq("traveler_id", currentUserId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  if (!data) notFound();

  const requestRow = data as TravelerRequestRow;

  let offers: GuideOfferRow[] = [];
  const guideInfoMap = new Map<
    string,
    { guide_id: string; full_name: string | null; avatar_url: string | null }
  >();
  const qaThreadMap = new Map<string, QaThread | null>();

  try {
    offers = await getOffersForRequest(requestId);

    if (offers.length > 0) {
      const guideIds = [...new Set(offers.map((o) => o.guide_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", guideIds);

      for (const p of profiles ?? []) {
        guideInfoMap.set(p.id, {
          guide_id: p.id,
          full_name: p.full_name,
          avatar_url: p.avatar_url ?? null,
        });
      }

      const pendingOfferIds = offers
        .filter((o) => o.status === "pending")
        .map((o) => o.id);

      if (pendingOfferIds.length > 0) {
        const { data: threads } = await supabase
          .from("conversation_threads")
          .select("id, offer_id")
          .in("offer_id", pendingOfferIds)
          .eq("subject_type", "offer");

        for (const offerId of pendingOfferIds) {
          const thread = (threads ?? []).find((t) => t.offer_id === offerId);
          if (thread) {
            try {
              const qaThread = await getQaMessages(thread.id);
              qaThreadMap.set(offerId, qaThread);
            } catch {
              qaThreadMap.set(offerId, null);
            }
          } else {
            qaThreadMap.set(offerId, null);
          }
        }
      }
    }
  } catch {
    // Non-fatal — render owner page without offers.
  }

  return {
    requestRow,
    ownerOffers: offers.map((offer) => ({
      offer,
      guideInfo: guideInfoMap.get(offer.guide_id) ?? null,
      qaThread: qaThreadMap.get(offer.id) ?? null,
    })),
  };
}

async function getGuideDetailData(requestId: string, guideId: string | null) {
  const supabase = await createSupabaseServerClient();

  let isApproved = false;
  let existingOfferId: string | null = null;
  let offerMeta: OfferMeta | null = null;

  if (guideId) {
    const { data: profile } = await supabase
      .from("guide_profiles")
      .select("verification_status")
      .eq("user_id", guideId)
      .maybeSingle();
    isApproved = profile?.verification_status === "approved";

    const { data: offer } = await supabase
      .from("guide_offers")
      .select("id, starts_at, capacity, price_minor, message")
      .eq("guide_id", guideId)
      .eq("request_id", requestId)
      .maybeSingle();
    existingOfferId = (offer?.id as string | undefined) ?? null;
    offerMeta = offer
      ? {
          starts_at: offer.starts_at as string | null,
          capacity: offer.capacity as number | null,
          price_minor: offer.price_minor as number | null,
          message: offer.message as string | null,
        }
      : null;
  }

  const { data: competingOffersData } = await supabase.rpc(
    "count_competing_offers",
    { p_request_id: requestId },
  );
  const competingOffers =
    typeof competingOffersData === "number" ? competingOffersData : 0;

  const { data: viewsData } = await supabase.rpc("record_request_view", {
    p_request_id: requestId,
  });
  const viewsCount = typeof viewsData === "number" ? viewsData : 0;

  return {
    isApproved,
    existingOfferId,
    offerMeta,
    competingOffers,
    viewsCount,
  };
}

export default async function RequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ requestId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { requestId } = await params;
  const sp = await searchParams;
  const justCreated = sp.created === "1";
  const createdMode = typeof sp.mode === "string" ? sp.mode : null;
  const result = await getRequestDetail(requestId);

  if (!result.data) notFound();

  let currentUserId: string | null = null;
  let isMember = false;
  let ownerId: string | null = null;
  const viewerRole = await viewerRoleForRequest(requestId);

  if (
    result.data.mode !== "assembly" &&
    viewerRole !== "owner" &&
    viewerRole !== "guide"
  ) {
    notFound();
  }

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

  if (viewerRole === "owner") {
    async function sendQa(threadId: string, body: string) {
      "use server";
      await sendQaMessageAction(threadId, body, requestId);
    }

    async function getOrCreateThread(offerId: string) {
      "use server";
      return getOrCreateQaThreadAction(offerId);
    }

    try {
      const { requestRow, ownerOffers } = await getOwnerDetailData(
        requestId,
        currentUserId,
      );

      return (
        <div className="flex flex-col gap-8">
          {justCreated ? (
            <div className="rounded-lg border border-success/40 bg-success/10 px-4 py-3 text-sm text-success">
              {createdMode === "assembly"
                ? "Открытая экскурсия опубликована — гиды увидят ваш запрос и смогут присоединиться."
                : "Запрос отправлен — гиды получат уведомление и ответят в ближайшее время."}
            </div>
          ) : null}
          <RequestDetailScreen
            viewerRole="owner"
            requestId={requestId}
            ownerRecord={mapTravelerRequestRow(requestRow)}
            ownerRequestRow={requestRow}
            ownerOffers={ownerOffers}
            onSendQa={sendQa}
            onGetOrCreateQaThread={getOrCreateThread}
          />
        </div>
      );
    } catch {
      notFound();
    }
  }

  if (viewerRole === "guide") {
    const guideData = await getGuideDetailData(requestId, currentUserId);

    return (
      <RequestDetailScreen
        viewerRole="guide"
        request={result.data}
        isApproved={guideData.isApproved}
        existingOfferId={guideData.existingOfferId}
        offerMeta={guideData.offerMeta}
        competingOffers={guideData.competingOffers}
        viewsCount={guideData.viewsCount}
      />
    );
  }

  const viewModel = buildViewModel({
    request: result.data,
    currentUserId,
    isMember,
    ownerId,
  });

  return (
    <RequestDetailScreen
      viewerRole={viewerRole === "admin" ? "admin" : "public"}
      requestId={requestId}
      viewModel={viewModel}
    />
  );
}
