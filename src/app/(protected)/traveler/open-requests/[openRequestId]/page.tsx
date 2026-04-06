import type { Metadata } from "next";
import { TravelerOpenRequestDetailScreen } from "@/features/traveler/components/open-requests/traveler-open-request-detail-screen";

export const metadata: Metadata = {
  title: "Открытый запрос",
};

export default async function TravelerOpenRequestDetailPage({
  params,
}: {
  params: Promise<{ openRequestId: string }>;
}) {
  const { openRequestId } = await params;
  return <TravelerOpenRequestDetailScreen openRequestId={openRequestId} />;
}

