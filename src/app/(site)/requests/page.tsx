import type { Metadata } from "next";
import { Suspense } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { CardGridSkeleton } from "@/components/shared/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import type { OpenRequestRecord } from "@/data/open-requests/types";
import { getOpenRequests, type RequestRecord } from "@/data/supabase/queries";
import { PublicRequestsMarketplaceScreen } from "@/features/requests/components/public-requests-marketplace-screen";
import { cityImage } from "@/lib/city-image";
import {
  getPublishedLocationCoversSafe,
  resolveLocationCover,
} from "@/lib/supabase/location-media";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// In-page skeleton replaces the removed (site)/loading.tsx boundary for this
// list (the shared boundary was deleted so sibling *detail* routes can return a
// real 404 — see the request/guide detail routes). A local Suspense keeps the
// marketplace skeleton here without re-introducing a boundary over the details.
function RequestsListSkeleton() {
  return (
    <div className="mx-auto w-full max-w-page flex flex-col gap-8 px-[clamp(20px,4vw,48px)] py-16">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-48 w-full rounded-card" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <CardGridSkeleton count={6} />
    </div>
  );
}

export function generateMetadata(): Metadata {
  return {
    title: "Запросы",
    description: "Запросы путешественников — предложите свои услуги гида",
  };
}

function mapToOpenRequestRecord(
  request: RequestRecord,
  viewerId: string | null,
  joinedRequestIds: Set<string>,
  covers: Map<string, string>,
): OpenRequestRecord {
  const isOwner = request.travelerId != null && request.travelerId === viewerId;
  // The free-text «Пожелания» is private (health/PII). The public marketplace is a
  // discovery surface — it never carries the notes for a non-owner (not even
  // contact-masked). The owner still sees their own brief on their own card.
  const maskedDescription = isOwner ? request.description : "";
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
    dateRangeLabel: request.dateLabel,
    datesFlexible: request.dateFlexibility === "few_days",
    timeLabel: request.startTime
      ? `${request.startTime}${request.endTime ? `–${request.endTime}` : ""}`
      : undefined,
    budgetPerPersonRub: request.budgetRub,
    highlights: [request.title, maskedDescription].filter(Boolean) as string[],
    interests: request.interests,
    themes: request.interests,
    notes: maskedDescription,
    organizerName: request.members[0]?.displayName ?? request.requesterName,
    members: request.members,
  };
}

export default function RequestsPage() {
  return (
    <Suspense fallback={<RequestsListSkeleton />}>
      <RequestsContent />
    </Suspense>
  );
}

export async function RequestsContent() {
  let initialData: OpenRequestRecord[] | null = null;
  let loadError = false;

  try {
    const supabase = await createSupabaseServerClient();
    const result = await getOpenRequests(supabase, undefined, ["open"]);
    let viewerId: string | null = null;
    try {
      const { data } = await supabase.auth.getUser();
      viewerId = data.user?.id ?? null;
    } catch {
      // Anonymous viewers (or clients without auth) simply own nothing.
    }
    if (result.error) {
      loadError = true;
    } else if (result.data && result.data.length > 0) {
      const assemblyRequests = result.data.filter((request) => request.mode === "assembly");
      const joinedRequestIds = new Set<string>();
      if (viewerId && assemblyRequests.length > 0) {
        const { data: memberships } = await supabase
          .from("open_request_members")
          .select("request_id")
          .eq("traveler_id", viewerId)
          .eq("status", "joined")
          .is("left_at", null)
          .in("request_id", assemblyRequests.map((request) => request.id));
        for (const membership of memberships ?? []) {
          if (membership.request_id) joinedRequestIds.add(membership.request_id as string);
        }
      }
      // Anon/user client: RLS plus the explicit status filter keep drafts out of public HTML.
      const covers = await getPublishedLocationCoversSafe(supabase);
      initialData = assemblyRequests.map((request) =>
        mapToOpenRequestRecord(request, viewerId, joinedRequestIds, covers),
      );
    }
  } catch {
    loadError = true;
  }

  if (loadError) {
    return (
      <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)] py-10">
        <Alert variant="destructive">
          <AlertDescription>
            Не удалось загрузить запросы. Попробуйте обновить страницу.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <PublicRequestsMarketplaceScreen initialData={initialData} />;
}
