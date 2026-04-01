import { redirect } from "next/navigation";

import { TravelerBookingReviewScreen } from "@/features/traveler/components/reviews/traveler-booking-review-screen";
import { getBooking } from "@/lib/supabase/bookings";
import { getReviewForBooking } from "@/lib/supabase/reviews";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { submitReview } from "./actions";

function resolveSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDateRange(startsOn: string | null, endsOn: string | null) {
  if (!startsOn) return "";
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  if (!endsOn || endsOn === startsOn) return fmt(startsOn);
  return `${fmt(startsOn)} — ${fmt(endsOn)}`;
}

export default async function TravelerBookingReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>;
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
}) {
  const { bookingId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const error = resolveSearchValue(resolvedSearchParams.error);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  const booking = await getBooking(bookingId);
  const review = await getReviewForBooking(bookingId);

  if (
    !booking ||
    booking.traveler_id !== user.id ||
    booking.status !== "completed" ||
    review
  ) {
    redirect(`/traveler/bookings/${bookingId}`);
  }

  return (
    <TravelerBookingReviewScreen
      booking={{
        id: booking.id,
        destination: booking.traveler_request?.destination ?? "Маршрут",
        dateLabel: formatDateRange(
          booking.traveler_request?.starts_on ?? booking.starts_at ?? null,
          booking.traveler_request?.ends_on ?? booking.ends_at ?? null,
        ),
        guideName:
          booking.guide_profile?.profile?.full_name ??
          booking.guide_profile?.display_name ??
          "Гид",
        guideAvatarUrl: booking.guide_profile?.profile?.avatar_url ?? null,
        guideVerified: booking.guide_profile?.verification_status === "approved",
      }}
      action={submitReview.bind(null, booking.id)}
      errorMessage={error === "invalid" ? "Проверьте оценку и текст отзыва." : null}
    />
  );
}

