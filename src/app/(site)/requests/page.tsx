import type { Metadata } from "next";

import type { OpenRequestRecord } from "@/data/open-requests/types";
import { getOpenRequests, type RequestRecord } from "@/data/supabase/queries";
import { PublicRequestsMarketplaceScreen } from "@/features/requests/components/public-requests-marketplace-screen";
import { cityImage } from "@/lib/city-image";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export function generateMetadata(): Metadata {
  return {
    title: "Центр запросов",
    description: "Запросы путешественников — предложите свои услуги гида",
  };
}

function mapToOpenRequestRecord(request: RequestRecord): OpenRequestRecord {
  return {
    id: request.id,
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
    highlights: [request.title, request.description].filter(Boolean) as string[],
    interests: request.interests,
    themes: request.interests,
    notes: request.description,
    organizerName: request.members[0]?.displayName ?? request.requesterName,
    members: request.members,
  };
}

export default async function RequestsPage() {
  let initialData: OpenRequestRecord[] | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const result = await getOpenRequests(supabase, undefined, ["open"]);
    if (result.data && result.data.length > 0) {
      initialData = result.data
        .filter((request) => request.mode === "assembly")
        .map(mapToOpenRequestRecord);
    }
  } catch {
    initialData = null;
  }

  return <PublicRequestsMarketplaceScreen initialData={initialData} />;
}
