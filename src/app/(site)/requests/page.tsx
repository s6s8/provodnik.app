import type { Metadata } from "next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import type { OpenRequestRecord } from "@/data/open-requests/types";
import { getOpenRequests, type RequestRecord } from "@/data/supabase/queries";
import { PublicRequestsMarketplaceScreen } from "@/features/requests/components/public-requests-marketplace-screen";
import { cityImage } from "@/lib/city-image";
import { maskPii } from "@/lib/pii/mask";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export function generateMetadata(): Metadata {
  return {
    title: "Запросы",
    description: "Запросы путешественников — предложите свои услуги гида",
  };
}

function mapToOpenRequestRecord(request: RequestRecord, viewerId: string | null): OpenRequestRecord {
  const isOwner = request.travelerId != null && request.travelerId === viewerId;
  // PII-012: mask contact details in the free-text for every non-owner viewer.
  const maskedDescription = isOwner ? request.description : maskPii(request.description);
  return {
    id: request.id,
    isOwner,
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
    cityImageUrl: cityImage(request.destination),
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

export default async function RequestsPage() {
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
      initialData = result.data
        .filter((request) => request.mode === "assembly")
        .map((request) => mapToOpenRequestRecord(request, viewerId));
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
