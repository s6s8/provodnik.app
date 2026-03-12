import { GuideBookingDetailScreen } from "@/features/guide/components/bookings/guide-booking-detail-screen";

export default async function GuideBookingDetailPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  return <GuideBookingDetailScreen bookingId={bookingId} />;
}

