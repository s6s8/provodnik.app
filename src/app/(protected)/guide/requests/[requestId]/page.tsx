import { notFound } from "next/navigation";

import { getSeededTravelerRequestById } from "@/data/traveler-request/seed";
import { GuideRequestDetailScreen } from "@/features/guide/components/requests/guide-request-detail-screen";

export default async function GuideRequestDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  const request = getSeededTravelerRequestById(requestId);

  if (!request) notFound();

  return <GuideRequestDetailScreen inboxItem={request} />;
}

