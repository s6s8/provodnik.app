import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getRequestById } from "@/data/supabase/queries";
import { GuideRequestDetailScreen } from "@/features/guide/components/requests/guide-request-detail-screen";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ requestId: string }>;
}): Promise<Metadata> {
  const { requestId } = await params;
  const supabase = await createSupabaseServerClient();
  const result = await getRequestById(supabase, requestId);
  if (!result.data) return { title: "Запрос не найден" };
  return {
    title: `${result.data.destination} — ${result.data.dateLabel}`,
  };
}

export default async function GuideRequestDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  const supabase = await createSupabaseServerClient();
  const result = await getRequestById(supabase, requestId);
  if (!result.data) notFound();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const guideId = session?.user?.id ?? null;

  let isApproved = false;
  let existingOfferId: string | null = null;

  if (guideId) {
    const { data: profile } = await supabase
      .from("guide_profiles")
      .select("verification_status")
      .eq("user_id", guideId)
      .maybeSingle();
    isApproved = profile?.verification_status === "approved";

    const { data: offer } = await supabase
      .from("guide_offers")
      .select("id")
      .eq("guide_id", guideId)
      .eq("request_id", requestId)
      .maybeSingle();
    existingOfferId = (offer?.id as string | undefined) ?? null;
  }

  const { data: competingOffersData } = await supabase.rpc(
    "count_competing_offers",
    { p_request_id: requestId },
  );
  const competingOffers =
    typeof competingOffersData === "number" ? competingOffersData : 0;

  return (
    <GuideRequestDetailScreen
      request={result.data}
      isApproved={isApproved}
      existingOfferId={existingOfferId}
      competingOffers={competingOffers}
    />
  );
}
