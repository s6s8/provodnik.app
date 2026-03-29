import type { Metadata } from "next";

import type { OpenRequestRecord } from "@/data/open-requests/types";
import { getOpenRequests, type RequestRecord } from "@/data/supabase/queries";
import { PublicRequestsMarketplaceScreen } from "@/features/requests/components/public/public-requests-marketplace-screen";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Маркетплейс запросов",
  description: "Присоединяйтесь к группам и путешествуйте по лучшей цене.",
};

function mapToOpenRequestRecord(request: RequestRecord): OpenRequestRecord {
  return {
    id: request.id,
    status: "open",
    visibility: "public",
    createdAt: request.createdAt,
    updatedAt: request.createdAt,
    travelerRequestId: request.id,
    group: {
      sizeTarget: request.capacity,
      sizeCurrent: request.groupSize,
      openToMoreMembers: request.groupSize < request.capacity,
    },
    destinationLabel: `${request.destination}, ${request.destinationRegion}`,
    imageUrl: request.imageUrl,
    regionLabel: request.destinationRegion,
    dateRangeLabel: request.dateLabel,
    budgetPerPersonRub: request.budgetRub,
    highlights: [request.title, request.description, request.format],
  };
}

export default async function RequestsPage() {
  let initialData: OpenRequestRecord[] | null = null;

  try {
    const client = await createSupabaseServerClient();
    const result = await getOpenRequests(client);

    if (result.data && result.data.length > 0) {
      initialData = result.data.map((request) => mapToOpenRequestRecord(request));
    }
  } catch {}

  return <PublicRequestsMarketplaceScreen initialData={initialData} />;
}
