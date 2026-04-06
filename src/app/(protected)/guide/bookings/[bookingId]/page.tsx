import type { Metadata } from "next";
import { GuideBookingDetailScreen } from "@/features/guide/components/bookings/guide-booking-detail-screen";

export const metadata: Metadata = {
  title: "Бронирование",
};

export default async function GuideBookingDetailPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  return <GuideBookingDetailScreen bookingId={bookingId} />;
}

