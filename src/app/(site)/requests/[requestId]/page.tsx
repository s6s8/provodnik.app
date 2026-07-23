import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
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
import { canSeeRequestNotes } from "@/features/requests/request-notes-visibility";
import { getRequestViewerContext, viewerRoleForRequest } from "@/lib/auth/viewer-role-for-request";
import { cityImage } from "@/lib/city-image";
import {
  getPublishedLocationCoversSafe,
  resolveLocationCover,
} from "@/lib/supabase/location-media";
import { friendlyError } from "@/lib/errors";
import { maskPii } from "@/lib/pii/mask";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isRequestMember } from "@/lib/supabase/request-members";
import {
  getOrCreateRequestThreadId,
  getRequestGroupThread,
  postRequestThreadMessage,
} from "@/lib/supabase/request-thread";
import { getBiddingGuidesForRequest, type BiddingGuide } from "@/lib/supabase/requests-public";
import { hasSupabaseEnv } from "@/lib/env";
import { getOffersForRequest } from "@/lib/supabase/offers";
import type { QaThread } from "@/lib/supabase/qa-threads";
import { getQaMessages } from "@/lib/supabase/qa-threads";
import type {
  GuideOfferRow,
  MessageSenderRole,
  TravelerRequestRow,
  Uuid,
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

  // notFound() thrown here (before the loading.tsx stream flushes the 200 shell)
  // yields a real HTTP 404. Returning a plain title kept the status at 200 (soft-404).
  if (!result.data) notFound();

  if (result.data.mode !== "assembly") {
    const viewerRole = await viewerRoleForRequest(requestId);
    if (viewerRole !== "owner" && viewerRole !== "guide") notFound();
  }

  return {
    title: `${result.data.destination} — ${result.data.dateLabel}`,
    // SEO metadata is public (search engines), so it must NEVER echo the private
    // free-text notes — only non-sensitive discovery facts (destination + dates).
    description: buildRequestMetaDescription(result.data),
    alternates: { canonical: `/requests/${requestId}` },
  };
}

const META_DESCRIPTION_FALLBACK = "Подробности открытой группы путешественников.";

function buildRequestMetaDescription(request: RequestRecord): string {
  const dest = request.destination?.trim();
  if (!dest) return META_DESCRIPTION_FALLBACK;
  const when = request.dateLabel?.trim() ? `, ${request.dateLabel.trim()}` : "";
  return `Открытая группа путешественников: ${dest}${when}. Присоединяйтесь или предложите свой маршрут.`;
}

// PII-012: everyone except the owner sees the request free-text with contact
// details masked. Owner paths use the raw record; guide/public/admin use this.
function maskRequestContacts(request: RequestRecord): RequestRecord {
  return { ...request, description: maskPii(request.description) };
}

function getTimeLabel(request: RequestRecord): string | undefined {
  if (request.dateFlexibility === "few_days") return undefined;
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
  includeNotes,
  coverUrl = null,
}: {
  request: RequestRecord;
  currentUserId: string | null;
  isMember: boolean;
  ownerId: string | null;
  // The free-text «Пожелания» is private (health/PII risk). Only authorized
  // viewers get it in the model; everyone else gets an empty string so no render
  // path (hero intro, member brief) can surface it. See canSeeRequestNotes.
  includeNotes: boolean;
  /** Published primary location cover, or null to keep the branded gradient. */
  coverUrl?: string | null;
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
    cityImageUrl: coverUrl ?? cityImage(request.destination),
    dateLabel: request.dateLabel,
    timeLabel: getTimeLabel(request),
    datesFlexible: request.dateFlexibility === "few_days",
    timeFlexible: request.dateFlexibility === "few_days",
    pricePerPersonRub: request.budgetRub > 0 ? request.budgetRub : null,
    memberCount: Math.max(request.groupSize, members.length),
    members,
    organizerName: members[0]?.displayName ?? organizerFallback,
    themes: request.interests,
    notes: includeNotes ? request.description : "",
    joinState: getJoinState({ request, currentUserId, isMember, ownerId }),
  };
}

// #42 — Post a message into the request group thread. Re-derives the viewer and
// thread server-side from the session (never trusts client input beyond the body);
// RLS enforces that only the owner/joined members/allowed guides can write.
async function postGroupMessage(
  requestId: string,
  body: string,
): Promise<{ error: string | null }> {
  "use server";
  const trimmed = body.trim();
  if (!trimmed) return { error: "Введите сообщение." };
  if (trimmed.length > 5000) return { error: "Сообщение слишком длинное." };

  const viewer = await getRequestViewerContext(requestId);
  if (!viewer.userId) return { error: "Требуется авторизация." };

  const senderRole: MessageSenderRole =
    viewer.role === "guide" ? "guide" : viewer.role === "admin" ? "admin" : "traveler";

  try {
    const threadId = await getOrCreateRequestThreadId(
      requestId as Uuid,
      viewer.userId as Uuid,
    );
    await postRequestThreadMessage({
      threadId,
      senderId: viewer.userId as Uuid,
      senderRole,
      body: trimmed,
    });
    return { error: null };
  } catch (err) {
    return { error: friendlyError(err, "Не удалось отправить сообщение.") };
  }
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
  let offersLoadError = false;
  const guideInfoMap = new Map<
    string,
    {
      guide_id: string;
      slug: string | null;
      full_name: string | null;
      avatar_url: string | null;
      rating: number | null;
      review_count: number | null;
      verified: boolean;
      years_experience: number | null;
      trips_completed: number | null;
      recommend_pct: number | null;
      languages: string[];
      specialties: string[];
    }
  >();
  const qaThreadMap = new Map<string, QaThread | null>();

  try {
    offers = await getOffersForRequest(requestId);

    if (offers.length > 0) {
      const guideIds = [...new Set(offers.map((o) => o.guide_id))];
      // profiles RLS закрывает чтение чужого профиля от лица путешественника,
      // поэтому имя и рейтинг гида берём из анонимно-читаемого представления.
      // Гид может оставить отклик только после проверки → присутствие в нём = «проверен».
      const { data: guidePublicProfiles } = await supabase
        .from("v_guide_public_profile")
        .select(
          "user_id, slug, full_name, avatar_url, average_rating, review_count, years_experience, trips_completed, recommend_pct, languages, specialties",
        )
        .in("user_id", guideIds);

      for (const g of guidePublicProfiles ?? []) {
        if (!g.user_id) continue;
        guideInfoMap.set(g.user_id, {
          guide_id: g.user_id,
          slug: (g.slug as string | null) ?? null,
          full_name: g.full_name,
          avatar_url: g.avatar_url,
          rating: g.average_rating,
          review_count: g.review_count,
          verified: true,
          years_experience: g.years_experience,
          trips_completed: g.trips_completed,
          recommend_pct: g.recommend_pct,
          languages: g.languages ?? [],
          specialties: g.specialties ?? [],
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
    offersLoadError = true;
  }

  return {
    requestRow,
    offersLoadError,
    ownerOffers: offers.map((offer) => ({
      offer,
      guideInfo: guideInfoMap.get(offer.guide_id) ?? null,
      qaThread: qaThreadMap.get(offer.id) ?? null,
    })),
  };
}

async function getBookingRedirectForMissingRequest(requestId: string): Promise<string | null> {
  const viewerContext = await getRequestViewerContext(requestId);
  if (!viewerContext.userId) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("bookings")
      .select("id, traveler_id, guide_id")
      .eq("request_id", requestId)
      .or(`traveler_id.eq.${viewerContext.userId},guide_id.eq.${viewerContext.userId}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const booking = data as { id?: string | null; guide_id?: string | null } | null;
    if (!booking?.id) return null;
    return booking.guide_id === viewerContext.userId
      ? `/guide/bookings/${booking.id}`
      : `/bookings/${booking.id}`;
  } catch {
    return null;
  }
}

async function getGuideDetailData(requestId: string, guideId: string | null) {
  const supabase = await createSupabaseServerClient();

  let isApproved = false;
  let existingOfferId: string | null = null;
  let offerMeta: OfferMeta | null = null;
  let existingOffer: GuideOfferRow | null = null;

  if (guideId) {
    const [{ data: profile }, { data: account }] = await Promise.all([
      supabase
        .from("guide_profiles")
        .select("verification_status")
        .eq("user_id", guideId)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("account_status")
        .eq("id", guideId)
        .maybeSingle(),
    ]);
    const isActiveAccount = !account?.account_status || account.account_status === "active";
    isApproved = isActiveAccount && profile?.verification_status === "approved";

    const { data: offer } = await supabase
      .from("guide_offers")
      .select("*")
      .eq("guide_id", guideId)
      .eq("request_id", requestId)
      .maybeSingle();
    existingOfferId = (offer?.id as string | undefined) ?? null;
    existingOffer = (offer as GuideOfferRow | null) ?? null;
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
    existingOffer,
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

  if (!result.data) {
    // The request is gone (withdrawn, deleted, or unreadable). If it already
    // turned into a booking, send the signed-in traveler/guide to that booking
    // instead of dead-ending stale offer notifications on a public 404.
    const bookingRedirect = await getBookingRedirectForMissingRequest(requestId);
    if (bookingRedirect) redirect(bookingRedirect);

    const missingViewerRole = await viewerRoleForRequest(requestId);
    if (missingViewerRole === "guide") redirect("/guide/inbox");
    if (missingViewerRole === "owner") redirect("/trips");
    notFound();
  }

  let currentUserId: string | null = null;
  let isMember = false;
  let ownerId: string | null = null;
  const viewerContext = await getRequestViewerContext(requestId);
  const viewerRole = viewerContext.role;
  currentUserId = viewerContext.userId;
  ownerId = result.data.travelerId ?? null;

  // Published primary cover for this destination; null keeps the branded gradient.
  let coverUrl: string | null = null;
  if (hasSupabaseEnv()) {
    try {
      const coverClient = await createSupabaseServerClient();
      coverUrl = resolveLocationCover(
        await getPublishedLocationCoversSafe(coverClient),
        result.data.destination,
      );
    } catch {
      // Cover lookup is decorative — never block the request page on it.
    }
  }

  if (
    result.data.mode !== "assembly" &&
    viewerRole !== "owner" &&
    viewerRole !== "guide"
  ) {
    notFound();
  }

  if (hasSupabaseEnv() && currentUserId) {
    try {
      isMember = await isRequestMember(requestId, currentUserId);
    } catch {
      // Degrade gracefully — membership unavailable
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

    let ownerData: Awaited<ReturnType<typeof getOwnerDetailData>>;
    try {
      ownerData = await getOwnerDetailData(requestId, currentUserId);
    } catch {
      notFound();
    }

    const ownerViewModel = buildViewModel({
      request: result.data,
      currentUserId,
      isMember,
      ownerId,
      includeNotes: true,
      coverUrl,
    });

    const ownerGroupThread = await getRequestGroupThread(requestId as Uuid);

    return (
      <RequestDetailScreen
        viewerRole="owner"
        requestId={requestId}
        ownerRecord={mapTravelerRequestRow(ownerData.requestRow)}
        ownerRequestRow={ownerData.requestRow}
        ownerOffers={ownerData.ownerOffers}
        offersLoadError={ownerData.offersLoadError}
        viewModel={ownerViewModel}
        justCreated={justCreated}
        createdMode={createdMode}
        onSendQa={sendQa}
        onGetOrCreateQaThread={getOrCreateThread}
        currentUserId={currentUserId ?? undefined}
        groupThread={ownerGroupThread}
        onSendGroupMessage={postGroupMessage.bind(null, requestId)}
      />
    );
  }

  if (viewerRole === "guide") {
    const guideData = await getGuideDetailData(requestId, currentUserId);
    // Only an APPROVED guide (one who can legitimately act on the request) sees the
    // private notes; an unverified guide gets the request without the free-text.
    const guideRequest = maskRequestContacts(result.data);
    const guideRequestForView = canSeeRequestNotes({
      viewerRole: "guide",
      isApprovedGuide: guideData.isApproved,
    })
      ? guideRequest
      : { ...guideRequest, description: "" };

    return (
      <RequestDetailScreen
        viewerRole="guide"
        request={guideRequestForView}
        cityImageUrl={coverUrl ?? undefined}
        isApproved={guideData.isApproved}
        existingOfferId={guideData.existingOfferId}
        offerMeta={guideData.offerMeta}
        existingOffer={guideData.existingOffer}
        competingOffers={guideData.competingOffers}
        viewsCount={guideData.viewsCount}
      />
    );
  }

  const viewModel = buildViewModel({
    request: maskRequestContacts(result.data),
    currentUserId,
    isMember,
    ownerId,
    // Admins keep moderation visibility; public / prospective / member viewers do
    // not see the private free-text notes.
    includeNotes: canSeeRequestNotes({
      viewerRole: viewerRole === "admin" ? "admin" : "public",
    }),
    coverUrl,
  });

  let biddingGuides: BiddingGuide[] = [];
  let biddingGuidesLoadError = false;
  if (hasSupabaseEnv()) {
    try {
      const sb = await createSupabaseServerClient();
      const biddingResult = await getBiddingGuidesForRequest(sb, requestId);
      biddingGuides = biddingResult.guides;
      biddingGuidesLoadError = biddingResult.loadError;
    } catch {
      biddingGuidesLoadError = true;
    }
  }

  // #42 — joined members get the group discussion. Anonymous/prospective viewers
  // do not (RLS would block them anyway); only load it for actual members.
  const memberGroupThread =
    isMember && currentUserId ? await getRequestGroupThread(requestId as Uuid) : undefined;

  return (
    <RequestDetailScreen
      viewerRole={viewerRole === "admin" ? "admin" : "public"}
      requestId={requestId}
      viewModel={viewModel}
      biddingGuides={biddingGuides}
      biddingGuidesLoadError={biddingGuidesLoadError}
      currentUserId={currentUserId ?? undefined}
      groupThread={memberGroupThread}
      onSendGroupMessage={postGroupMessage.bind(null, requestId)}
    />
  );
}
