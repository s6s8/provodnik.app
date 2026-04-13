import type { Metadata } from "next";

import { notFound, redirect } from "next/navigation";

import { BookingFormTabs } from "@/features/booking/components/BookingFormTabs";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Оформление бронирования",
};

export default async function BookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth?next=/listings/${id}/book`);

  const { data: listing } = await supabase
    .from("listings")
    .select(
      "id, guide_id, title, region, price_from_minor, currency, max_group_size, format, category, status",
    )
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (!listing) notFound();

  return (
    <div className="mx-auto max-w-lg py-8 px-4">
      <h1 className="text-2xl font-semibold mb-2">{listing.title}</h1>
      <p className="text-muted-foreground mb-6">от {listing.price_from_minor / 100} ₽</p>
      <BookingFormTabs listing={listing} />
    </div>
  );
}
