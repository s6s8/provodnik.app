import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { OpenRequestRecord } from "@/data/open-requests/types";
import { getRequestById, type RequestRecord } from "@/data/supabase/queries";
import { PublicRequestDetailScreen } from "@/features/requests/components/public/public-request-detail-screen";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
    destinationLabel: `${request.destination}, ${request.destinationRegion}`,
    imageUrl: request.imageUrl,
    regionLabel: request.destinationRegion,
    dateRangeLabel: request.dateLabel,
    budgetPerPersonRub: request.budgetRub,
    highlights: [request.title, request.description, request.format].filter(Boolean) as string[],
  };
}

export default async function RequestDetailPage({
  params,
}: {
  params: { requestId: string };
}) {
  let request: OpenRequestRecord | null = null;

  try {
    const client = await createSupabaseServerClient();
    const result = await getRequestById(client, params.requestId);
    if (result.data) {
      request = mapToOpenRequestRecord(result.data);
    }
  } catch {}

  if (!request) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="editorial-kicker">Запрос не найден</p>
          <h1 className="text-3xl font-semibold tracking-tight">404</h1>
        </div>
        <Button asChild variant="default" size="lg" className="rounded-full">
          <Link href="/requests">Вернуться в биржу</Link>
        </Button>
      </div>
    );
  }

  return <PublicRequestDetailScreen request={request} />;
}
