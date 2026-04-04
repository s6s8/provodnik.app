import { notFound, redirect } from "next/navigation";

import { getRequestById } from "@/data/supabase/queries";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";
import { hasGuideOffered } from "@/lib/supabase/offers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OfferFormClient } from "@/features/guide/components/requests/offer-form-client";

async function getGuideIdFromSession(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

export default async function GuideOfferFormPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;

  // Auth check
  const auth = await readAuthContextFromServer();
  if (!auth.isAuthenticated && auth.source !== "demo") {
    redirect("/auth");
  }

  // Load request
  const result = await getRequestById(null as never, requestId);
  if (!result.data) notFound();
  const request = result.data;

  // Duplicate guard — if guide already has an offer, send them back
  const guideId = await getGuideIdFromSession();
  if (guideId) {
    const alreadyOffered = await hasGuideOffered(guideId, requestId);
    if (alreadyOffered) {
      redirect(`/guide/requests/${requestId}?offered=1`);
    }
  }

  // Default valid_until: today + 7 days
  const validUntilDefault = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  })();

  return (
    <OfferFormClient
      requestId={requestId}
      request={request}
      validUntilDefault={validUntilDefault}
    />
  );
}
