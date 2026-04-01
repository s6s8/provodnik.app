import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { getBooking } from "@/lib/supabase/bookings";
import type { BookingStatus } from "@/lib/bookings/state-machine";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formatRub(minorUnits: number) {
  const rub = Math.round(minorUnits / 100);
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(rub);
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

function getInitials(name: string | null) {
  if (!name) return "Г";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

// BookingStatus from state-machine is narrower than types.ts — cast safely
function toStateMachineStatus(s: string): BookingStatus {
  const allowed: BookingStatus[] = ["pending", "confirmed", "completed", "cancelled", "disputed"];
  return allowed.includes(s as BookingStatus)
    ? (s as BookingStatus)
    : "pending";
}

export default async function TravelerBookingDetailPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  const booking = await getBooking(bookingId);

  if (!booking) notFound();

  // Guard: only the booking owner can see this page
  if (booking.traveler_id !== user.id) {
    redirect("/traveler/bookings");
  }

  const guideProfile = booking.guide_profile;
  const guideProfileData = guideProfile?.profile ?? null;
  const guideName =
    guideProfileData?.full_name ?? guideProfile?.display_name ?? "Гид";
  const guidePhone = guideProfileData?.phone ?? null;
  const guideAvatarUrl = guideProfileData?.avatar_url ?? null;
  const isVerified = guideProfile?.verification_status === "approved";

  const request = booking.traveler_request;
  const destination = request?.destination ?? "Маршрут";
  const dateRange = formatDateRange(
    request?.starts_on ?? null,
    request?.ends_on ?? null,
  );

  const priceMinor =
    booking.guide_offer?.price_minor ?? booking.subtotal_minor ?? 0;

  const status = toStateMachineStatus(booking.status);

  return (
    <div className="booking-confirm-shell">
      <div className="booking-confirm-container">

        {/* Heading */}
        <div className="booking-confirm-heading">
          <h1 className="booking-confirm-title">Бронирование создано</h1>
          <BookingStatusBadge status={status} />
        </div>

        {/* Trip summary */}
        <div className="booking-confirm-card">
          <p className="booking-confirm-card-label">Детали поездки</p>
          <p className="booking-confirm-destination">{destination}</p>
          {dateRange ? (
            <p className="booking-confirm-dates">{dateRange}</p>
          ) : null}
          <p className="booking-confirm-price">{formatRub(priceMinor)}</p>
        </div>

        {/* Guide contact card */}
        <div className="glass-card booking-confirm-guide-card">
          <p className="booking-confirm-guide-label">Свяжитесь с гидом напрямую</p>
          <div className="booking-confirm-guide-header">
            <div className="booking-confirm-guide-avatar">
              {guideAvatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={guideAvatarUrl}
                  alt={guideName}
                  className="booking-confirm-guide-avatar-img"
                />
              ) : (
                <span className="booking-confirm-guide-avatar-initials">
                  {getInitials(guideName)}
                </span>
              )}
            </div>
            <div className="booking-confirm-guide-meta">
              <p className="booking-confirm-guide-name">
                {guideName}
                {isVerified ? (
                  <span className="booking-confirm-verified-badge" aria-label="Верифицирован">
                    ✓
                  </span>
                ) : null}
              </p>
              {guidePhone ? (
                <p className="booking-confirm-guide-contact">
                  <span className="booking-confirm-contact-label">Телефон:</span>{" "}
                  <a href={`tel:${guidePhone}`} className="booking-confirm-contact-link">
                    {guidePhone}
                  </a>
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Muted note */}
        <p className="booking-confirm-note">
          Итоговая стоимость и детали поездки обсуждаются с гидом напрямую
        </p>

        {/* Back link */}
        <Link href="/traveler/bookings" className="booking-confirm-back-link">
          ← Мои бронирования
        </Link>

      </div>
    </div>
  );
}
