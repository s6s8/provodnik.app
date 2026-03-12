import { TravelerBookingReviewScreen } from "@/features/traveler/components/reviews/traveler-booking-review-screen";

export default async function TravelerBookingReviewPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  return <TravelerBookingReviewScreen bookingId={bookingId} />;
}

