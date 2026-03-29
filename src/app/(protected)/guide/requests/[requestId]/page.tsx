import { notFound } from "next/navigation";

import { getRequestById } from "@/data/supabase/queries";
import { GuideRequestDetailScreen } from "@/features/guide/components/requests/guide-request-detail-screen";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function GuideRequestDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  const client = await createSupabaseServerClient();
  const result = await getRequestById(client, requestId);

  if (!result.data) notFound();

  return <GuideRequestDetailScreen inboxItem={result.data} />;
}
