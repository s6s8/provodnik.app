import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getRequestById } from "@/data/supabase/queries";
import type { OfferMeta } from "@/features/guide/components/requests/offer-meta";
import { RequestDetailScreen } from "@/features/requests/components/request-detail-screen";
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
  let offerMeta: OfferMeta | null = null;

  if (guideId) {
    const { data: profile } = await supabase
      .from("guide_profiles")
      .select("verification_status")
      .eq("user_id", guideId)
      .maybeSingle();
    isApproved = profile?.verification_status === "approved";

    const { data: offer } = await supabase
      .from("guide_offers")
      .select("id, starts_at, capacity, price_minor, message")
      .eq("guide_id", guideId)
      .eq("request_id", requestId)
      .maybeSingle();
    existingOfferId = (offer?.id as string | undefined) ?? null;
    offerMeta = offer
      ? {
          starts_at: offer.starts_at as string | null,
          capacity: offer.capacity as number | null,
          price_minor: offer.price_minor as number | null,
          message: offer.message as string | null,
        }
      : null;
  }

  const { data: competingOffersData } = await supabase.rpc(
    "count_competing_offers",
    { p_request_id: requestId },
  );
  const competingOffers =
    typeof competingOffersData === "number" ? competingOffersData : 0;

  const { data: viewsData } = await supabase.rpc("record_request_view", {
    p_request_id: requestId,
  });
  const viewsCount = typeof viewsData === "number" ? viewsData : 0;

  return (
    <RequestDetailScreen
      viewerRole="guide"
      request={result.data}
      isApproved={isApproved}
      existingOfferId={existingOfferId}
      offerMeta={offerMeta}
      competingOffers={competingOffers}
      viewsCount={viewsCount}
    />
  );
}
