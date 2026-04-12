import { notFound, redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ListingRow } from "@/lib/supabase/types";

export default async function GuideListingNewPageV1() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    notFound();
  }

  const userId = session.user.id;

  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      guide_id: userId,
      title: "Новый тур",
      slug: `draft-${Date.now()}`,
      region: "Не указан",
      category: "tour",
      price_from_minor: 0,
      currency: "RUB",
      status: "draft",
    })
    .select()
    .single();

  if (error || !listing) {
    notFound();
  }

  redirect(`/guide/listings/${(listing as ListingRow).id}/edit`);
  // redirect() throws internally — this return is unreachable but satisfies TypeScript
  return null;
}
