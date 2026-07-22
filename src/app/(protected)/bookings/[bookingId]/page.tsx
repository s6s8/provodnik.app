import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  BookingDetailScreen,
  type BookingListing,
} from "@/features/bookings/components/booking-detail-screen";
import { openBookingThreadAction } from "@/features/bookings/booking-actions";
import { viewerRoleForBooking } from "@/lib/auth/viewer-role-for-booking";
import { getBooking } from "@/lib/supabase/bookings";
import { getPaymentAgreementForBooking } from "@/lib/supabase/payment-agreements";
import { getReviewForBooking } from "@/lib/supabase/reviews";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type BookingPageProps = {
  params: Promise<{ bookingId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function resolveSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({
  params,
}: BookingPageProps): Promise<Metadata> {
  const { bookingId } = await params;

  return {
    title: "Бронирование",
    alternates: {
      canonical: `/bookings/${bookingId}`,
    },
  };
}

export default async function BookingDetailPage({
  params,
  searchParams,
}: BookingPageProps) {
  const { bookingId } = await params;
  const role = await viewerRoleForBooking(bookingId);

  if (!role) notFound();

  if (role === "guide") {
    return <BookingDetailScreen viewerRole="guide" bookingId={bookingId} />;
  }

  const booking = await getBooking(bookingId);
  if (!booking) notFound();

  const paymentAgreement = await getPaymentAgreementForBooking(bookingId).catch(
    () => null,
  );

  const supabase = await createSupabaseServerClient();
  // Only a listing-backed (ready/fixed) booking has an excursion programme —
  // title, city and the "what awaits you" content all come from that row.
  let listing: BookingListing | null = null;
  if (booking.listing_id) {
    const { data: listingRow } = await supabase
      .from("listings")
      .select("title, description, inclusions, city")
      .eq("id", booking.listing_id)
      .maybeSingle();
    listing = listingRow ?? null;
  }

  if (role === "admin") {
    return (
      <BookingDetailScreen
        viewerRole="admin"
        booking={booking}
        listing={listing}
        paymentAgreement={paymentAgreement}
      />
    );
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const reviewStatus = resolveSearchValue(resolvedSearchParams.review);
  const disputeStatus = resolveSearchValue(resolvedSearchParams.dispute);
  const existingReview =
    booking.status === "completed" ? await getReviewForBooking(booking.id) : null;

  return (
    <BookingDetailScreen
      viewerRole="traveler"
      booking={booking}
      canMessageGuide={booking.traveler_request?.traveler_id === booking.traveler_id}
      existingReview={existingReview}
      listing={listing}
      paymentAgreement={paymentAgreement}
      reviewStatus={reviewStatus}
      disputeStatus={disputeStatus}
      openBookingThreadAction={async (bookingId: string) => {
        "use server";
        const formData = new FormData();
        formData.set("booking_id", bookingId);
        return openBookingThreadAction(formData);
      }}
    />
  );
}
