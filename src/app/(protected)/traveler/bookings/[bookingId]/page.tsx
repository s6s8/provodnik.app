import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { OpenDisputeButton } from "@/features/disputes/components/open-dispute-button";
import { FourAxisReviewForm } from "@/features/reviews/components/FourAxisReviewForm";
import { getBooking } from "@/lib/supabase/bookings";
import type { BookingStatus } from "@/lib/bookings/state-machine";
import { flags } from "@/lib/flags";
import { getReviewForBooking } from "@/lib/supabase/reviews";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { BookingTicketTrigger } from "@/features/bookings/components/booking-ticket-trigger";
import { SupportSidebar } from "@/features/bookings/components/support-sidebar";

import { DemoModeBanner } from "./_components/demo-mode-banner";
import { MockPaymentButton } from "./_components/mock-payment-button";
import { openBookingThreadAction } from "./actions";

export const metadata: Metadata = {
  title: "Бронирование",
};

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

function toStateMachineStatus(s: string) {
  const allowed: BookingStatus[] = [
    "pending",
    "confirmed",
    "completed",
    "cancelled",
    "disputed",
  ];
  if (allowed.includes(s as BookingStatus)) return s as BookingStatus;
  if (s === "awaiting_guide_confirmation") return "pending";
  return "pending";
}

const BOOKING_HEADINGS: Record<BookingStatus, string> = {
  pending: "Бронирование ожидает подтверждения",
  awaiting_guide_confirmation: "Ожидает подтверждения гида",
  confirmed: "Бронирование подтверждено",
  completed: "Поездка завершена",
  cancelled: "Бронирование отменено",
  disputed: "Открыт спор по бронированию",
  no_show: "Гость не явился",
};

function resolveSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TravelerBookingDetailPage({
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
  const reviewStatus = resolveSearchValue(resolvedSearchParams.review);
  const disputeStatus = resolveSearchValue(resolvedSearchParams.dispute);

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
  const existingReview =
    booking.status === "completed" ? await getReviewForBooking(booking.id) : null;
  const canOpenDispute =
    booking.status === "confirmed" || booking.status === "completed";

  let listingTitle = "Поездка";
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
    <div className="space-y-6">
      <DemoModeBanner />
      <MockPaymentButton />
      {reviewStatus === "success" ? (
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Отзыв отправлен</CardTitle>
            <p className="text-sm text-muted-foreground">
              Спасибо. Отзыв сохранён и появится в профиле гида.
            </p>
          </CardHeader>
        </Card>
      ) : null}

      {disputeStatus === "success" ? (
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Спор открыт</CardTitle>
            <p className="text-sm text-muted-foreground">
              Мы передали его на рассмотрение и привязали к этой поездке.
            </p>
          </CardHeader>
        </Card>
      ) : null}

      <div className="py-12">
        <div className="max-w-[640px] mx-auto px-[var(--px)] flex flex-col gap-6">
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="font-display text-[clamp(1.875rem,4vw,2.5rem)] font-semibold leading-[1.05] text-foreground">{BOOKING_HEADINGS[status]}</h1>
            <BookingStatusBadge status={status} />
          </div>

          <div className="bg-surface-high rounded-card p-5 px-6 shadow-card flex flex-col gap-1.5">
            <p className="font-sans text-[0.6875rem] font-medium tracking-[0.18em] uppercase text-muted-foreground mb-1">Детали поездки</p>
            <p className="font-display text-[1.375rem] font-semibold text-foreground leading-[1.2]">{destination}</p>
            {dateRange ? <p className="font-sans text-sm text-muted-foreground">{dateRange}</p> : null}
            <p className="font-sans text-[1.125rem] font-semibold text-foreground mt-1">{formatRub(priceMinor)}</p>
          </div>

          <div className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass p-5 px-6 flex flex-col gap-3.5">
            <p className="font-sans text-[0.6875rem] font-medium tracking-[0.18em] uppercase text-muted-foreground">Свяжитесь с гидом напрямую</p>
            <div className="flex items-center gap-3.5">
              <Avatar className="size-13 border-2 border-glass-border">
                <AvatarImage src={guideAvatarUrl ?? undefined} alt={guideName} className="object-cover" />
                <AvatarFallback className="font-display text-xl font-semibold text-primary">
                  {getInitials(guideName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 flex flex-col gap-[0.3rem]">
                <p className="font-sans text-base font-semibold text-foreground flex items-center gap-1.5">
                  {guideName}
                  {isVerified ? (
                    <span
                      className="inline-flex items-center justify-center size-[18px] rounded-full bg-primary text-white text-[0.625rem] font-bold shrink-0"
                      aria-label="Верифицирован"
                    >
                      ✓
                    </span>
                  ) : null}
                </p>
                {guidePhone ? (
                  <p className="font-sans text-sm text-muted-foreground">
                    <span className="font-medium">Телефон:</span>{" "}
                    <a
                      href={`tel:${guidePhone}`}
                      className="text-primary no-underline hover:underline"
                    >
                      {guidePhone}
                    </a>
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <form
                action={openBookingThreadAction}
                className="flex"
              >
                <input type="hidden" name="booking_id" value={booking.id} />
                <Button type="submit">Написать гиду</Button>
              </form>

              {(booking.status === "confirmed" || booking.status === "completed") ? (
                <BookingTicketTrigger
                  bookingId={booking.id}
                  listingTitle={listingTitle}
                  guideName={guideName}
                  guidePhone={guidePhone}
                  dateRange={dateRange}
                />
              ) : null}

              {flags.FEATURE_TR_DISPUTES &&
              booking.status !== "disputed" &&
              canOpenDispute ? (
                <OpenDisputeButton bookingId={booking.id} />
              ) : null}
            </div>
          </div>

          {booking.status === "completed" && !existingReview ? (
            <FourAxisReviewForm
              bookingId={booking.id}
              guideId={booking.guide_id}
              listingId={booking.listing_id ?? ""}
              listingTitle={listingTitle}
            />
          ) : null}

          <p className="font-sans text-[0.8125rem] text-muted-foreground leading-[1.6] p-3.5 px-4 rounded-[12px] border border-glass-border bg-outline-variant/[0.08]">
            Итоговая стоимость и детали поездки обсуждаются с гидом напрямую
          </p>

          <SupportSidebar bookingId={booking.id} />

          <Link
            href="/traveler/bookings"
            className="font-sans text-sm font-medium text-primary no-underline inline-flex items-center gap-1 hover:underline"
          >
            ← Мои бронирования
          </Link>
        </div>
      </div>
    </div>
  );
}
