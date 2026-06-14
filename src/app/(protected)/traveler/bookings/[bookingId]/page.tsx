import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { BookingDetailScreen } from "@/features/bookings/components/booking-detail-screen";
import { getBooking } from "@/lib/supabase/bookings";
import { buildAuthLoginRedirect } from "@/lib/auth/safe-redirect";
import { getReviewForBooking } from "@/lib/supabase/reviews";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { openBookingThreadAction } from "./actions";

export const metadata: Metadata = {
  title: "Бронирование",
};

function resolveSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TravelerBookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { bookingId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const reviewStatus = resolveSearchValue(resolvedSearchParams.review);
  const disputeStatus = resolveSearchValue(resolvedSearchParams.dispute);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(buildAuthLoginRedirect(`/traveler/bookings/${bookingId}`));
  }

  const booking = await getBooking(bookingId);

  if (!booking) notFound();
  if (booking.traveler_id !== user.id) {
    redirect("/traveler/requests");
  }

  const existingReview =
    booking.status === "completed" ? await getReviewForBooking(booking.id) : null;

  let listingTitle: string | undefined;
  if (booking.listing_id) {
    const { data: listingRow } = await supabase
      .from("listings")
      .select("title")
      .eq("id", booking.listing_id)
      .maybeSingle();
    if (listingRow?.title) {
      listingTitle = listingRow.title;
    }
  }

  return (
    <BookingDetailScreen
      viewerRole="traveler"
      booking={booking}
      existingReview={existingReview}
      listingTitle={listingTitle}
      reviewStatus={reviewStatus}
      disputeStatus={disputeStatus}
      openBookingThreadAction={async (formData: FormData) => {
        "use server";
        const result = await openBookingThreadAction(formData);
        if (result.error) {
          redirect("/messages");
        }
        redirect(`/messages/${result.threadId}`);
      }}
    />
  );
}
