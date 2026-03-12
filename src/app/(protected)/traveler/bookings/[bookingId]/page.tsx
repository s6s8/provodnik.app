import { TravelerBookingDetailScreen } from "@/features/traveler/components/bookings/traveler-booking-detail-screen";

export default async function TravelerBookingDetailPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  return <TravelerBookingDetailScreen bookingId={bookingId} />;
}

