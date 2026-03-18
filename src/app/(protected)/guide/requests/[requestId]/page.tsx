import { notFound } from "next/navigation";

import { GuideRequestDetailRoute } from "@/features/guide/components/requests/guide-request-detail-route";

export default async function GuideRequestDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  if (!requestId) notFound();
  return <GuideRequestDetailRoute requestId={requestId} />;
}

