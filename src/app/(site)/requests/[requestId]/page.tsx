import type { Metadata } from "next";
import { notFound } from "next/navigation";

import type { OpenRequestRecord } from "@/data/open-requests/types";
import { getRequestById, type RequestRecord } from "@/data/supabase/queries";
import { PublicRequestDetailScreen } from "@/features/requests/components/public/public-request-detail-screen";

export const metadata: Metadata = {
  title: "\u0414\u0435\u0442\u0430\u043b\u0438 \u0437\u0430\u043f\u0440\u043e\u0441\u0430",
  description:
    "\u041f\u043e\u0434\u0440\u043e\u0431\u043d\u043e\u0441\u0442\u0438 \u043e\u0442\u043a\u0440\u044b\u0442\u043e\u0439 \u0433\u0440\u0443\u043f\u043f\u044b \u043f\u0443\u0442\u0435\u0448\u0435\u0441\u0442\u0432\u0435\u043d\u043d\u0438\u043a\u043e\u0432.",
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

  return <PublicRequestDetailScreen request={mapToOpenRequestRecord(result.data)} />;
}
