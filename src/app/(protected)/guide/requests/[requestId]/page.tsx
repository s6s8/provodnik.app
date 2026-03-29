import { notFound } from "next/navigation";

import { getRequestById } from "@/data/supabase/queries";
import { GuideRequestDetailScreen } from "@/features/guide/components/requests/guide-request-detail-screen";

export default async function GuideRequestDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  const result = await getRequestById(null as any, requestId);

  if (!result.data) notFound();

  return <GuideRequestDetailScreen inboxItem={result.data} />;
}
