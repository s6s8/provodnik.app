import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ConfirmedBookingCard } from "@/features/traveler/components/requests/confirmed-booking-card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getConfirmedBookings } from "@/lib/supabase/traveler-requests";

export const metadata: Metadata = {
  title: "Мои бронирования — Provodnik",
};

export default async function TravelerBookingsIndexPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/traveler/bookings");

  const bookings = await getConfirmedBookings(user.id);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Мои бронирования</h1>
        <Link
          href="/traveler/requests"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          К моим запросам
        </Link>
      </header>

      {bookings.length === 0 ? (
        <div className="rounded-xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Подтверждённых бронирований пока нет. Когда гид примет ваш запрос, поездка появится здесь.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {bookings.map((booking) => (
            <ConfirmedBookingCard key={booking.booking_id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}
