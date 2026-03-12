import { TravelerRequestDetailScreen } from "@/features/traveler/components/requests/traveler-request-detail-screen";

export default async function TravelerRequestDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  return <TravelerRequestDetailScreen requestId={requestId} />;
}

