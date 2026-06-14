import type { Metadata } from "next";
import { BookingDetailScreen } from "@/features/bookings/components/booking-detail-screen";

export const metadata: Metadata = {
  title: "Бронирование",
};

export default async function GuideBookingDetailPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  return <BookingDetailScreen viewerRole="guide" bookingId={bookingId} />;
}

