import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { ProfileAvatar } from "@/components/profile-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { CancelBookingButton } from "@/features/bookings/components/cancel-booking-button";
import { OpenDisputeButton } from "@/features/disputes/components/open-dispute-button";
import { FourAxisReviewForm } from "@/features/reviews/components/FourAxisReviewForm";
import { getBooking } from "@/lib/supabase/bookings";
import type { BookingStatus } from "@/lib/bookings/state-machine";
import { buildAuthLoginRedirect } from "@/lib/auth/safe-redirect";
import { flags } from "@/lib/flags";
import { resolveDisplayName } from "@/lib/profile/resolve-display-name";
import { getReviewForBooking } from "@/lib/supabase/reviews";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTheme } from "@/data/themes";

import { BookingTicketTrigger } from "@/features/bookings/components/booking-ticket-trigger";
import { SupportSidebar } from "@/features/bookings/components/support-sidebar";

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

function formatTime(isoOrTime: string | null | undefined): string {
  if (!isoOrTime) return "";
  // "HH:MM" or "HH:MM:SS"
  if (/^\d{2}:\d{2}/.test(isoOrTime)) return isoOrTime.slice(0, 5);
  try {
    return new Date(isoOrTime).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
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

const CANCELLABLE_FOR_TRAVELER: BookingStatus[] = ["pending", "confirmed"];

function resolveSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TravelerBookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
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
    redirect(buildAuthLoginRedirect(`/traveler/bookings/${bookingId}`));
  }

  const booking = await getBooking(bookingId);

  if (!booking) notFound();
  if (booking.traveler_id !== user.id) {
    redirect("/traveler/requests");
  }

  const guideProfile = booking.guide_profile;
  const guideProfileData = guideProfile?.profile ?? null;
  const guideName = resolveDisplayName("guide", { full_name: guideProfileData?.full_name });
  const guidePhone = guideProfileData?.phone ?? null;
  const guideAvatarUrl = guideProfileData?.avatar_url ?? null;
  const isVerified = guideProfile?.verification_status === "approved";

  const request = booking.traveler_request;
  const offer = booking.guide_offer;
  const destination = request?.destination ?? "Маршрут";
  const dateRange = formatDateRange(
    request?.starts_on ?? null,
    request?.ends_on ?? null,
  );

  // Meeting time: prefer offer.starts_at, fall back to request.start_time
  const meetingTime = formatTime(offer?.starts_at ?? request?.start_time);
  // Meeting place: from booking row
  const meetingPlace = booking.meeting_point ?? null;

  const priceMinor = offer?.price_minor ?? booking.subtotal_minor ?? 0;
  const partySize = booking.party_size ?? request?.participants_count ?? 1;
  const pricePerPersonMinor = partySize > 1 ? Math.round(priceMinor / partySize) : priceMinor;

  // What's included from guide offer
  const inclusions: string[] = offer?.inclusions ?? [];

  // Description: offer.message or request.notes
  const description = offer?.message || request?.notes || null;

  // Theme labels
  const interests: string[] = request?.interests ?? [];
  const themeLabels = interests
    .map((slug) => getTheme(slug)?.label)
    .filter(Boolean) as string[];

  const status = toStateMachineStatus(booking.status);
  const canCancel = CANCELLABLE_FOR_TRAVELER.includes(status);
  const existingReview =
    booking.status === "completed" ? await getReviewForBooking(booking.id) : null;
  const canOpenDispute =
    booking.status === "confirmed" || booking.status === "completed";

  let listingTitle = dateRange ? `${destination}, ${dateRange}` : destination;
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
          {/* Heading + status + cancel */}
          <div className="flex items-start gap-3 flex-wrap justify-between">
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="font-display text-[clamp(1.875rem,4vw,2.5rem)] font-semibold leading-[1.05] text-foreground">{BOOKING_HEADINGS[status]}</h1>
              <BookingStatusBadge status={status} />
            </div>
            {canCancel ? <CancelBookingButton bookingId={booking.id} /> : null}
          </div>

          {/* Trip details */}
          <div className="bg-surface-high rounded-card p-5 px-6 shadow-card flex flex-col gap-2">
            <p className="font-sans text-[0.6875rem] font-medium tracking-[0.18em] uppercase text-muted-foreground mb-1">Детали поездки</p>
            <p className="font-display text-[1.375rem] font-semibold text-foreground leading-[1.2]">{destination}</p>
            {dateRange ? (
              <p className="font-sans text-sm text-muted-foreground">
                {dateRange}{meetingTime ? ` · ${meetingTime}` : ""}
              </p>
            ) : null}
            {meetingPlace ? (
              <p className="font-sans text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Место встречи:</span> {meetingPlace}
              </p>
            ) : null}
            {themeLabels.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {themeLabels.map((label) => (
                  <Badge key={label} variant="secondary" className="text-xs">{label}</Badge>
                ))}
              </div>
            ) : null}
            {partySize > 0 ? (
              <p className="font-sans text-sm text-muted-foreground">
                {partySize} {partySize === 1 ? "человек" : partySize < 5 ? "человека" : "человек"}
                {request?.open_to_join ? " · сборная группа" : ""}
              </p>
            ) : null}
          </div>

          {/* Excursion details from guide offer */}
          {(description || inclusions.length > 0 || offer?.title) ? (
            <div className="bg-surface-high rounded-card p-5 px-6 shadow-card flex flex-col gap-3">
              <p className="font-sans text-[0.6875rem] font-medium tracking-[0.18em] uppercase text-muted-foreground">Что вас ждёт</p>
              {offer?.title ? (
                <p className="font-sans text-base font-semibold text-foreground">{offer.title}</p>
              ) : null}
              {description ? (
                <p className="font-sans text-sm text-foreground leading-[1.6] whitespace-pre-line">{description}</p>
              ) : null}
              {inclusions.length > 0 ? (
                <div>
                  <p className="font-sans text-xs font-medium text-muted-foreground uppercase tracking-[0.12em] mb-1.5">Включено</p>
                  <ul className="flex flex-col gap-1">
                    {inclusions.map((item) => (
                      <li key={item} className="font-sans text-sm text-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Price block */}
          <div className="bg-surface-high rounded-card p-5 px-6 shadow-card flex flex-col gap-1.5">
            <p className="font-sans text-[0.6875rem] font-medium tracking-[0.18em] uppercase text-muted-foreground mb-1">Стоимость</p>
            {partySize > 1 ? (
              <>
                <p className="font-sans text-sm text-muted-foreground">
                  {formatRub(pricePerPersonMinor)} <span className="text-muted-foreground/70">/ человек</span>
                </p>
                <p className="font-sans text-[1.125rem] font-semibold text-foreground">
                  Итого: {formatRub(priceMinor)}
                </p>
              </>
            ) : (
              <p className="font-sans text-[1.125rem] font-semibold text-foreground">{formatRub(priceMinor)}</p>
            )}
          </div>

          {/* Guide contact */}
          <div className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass p-5 px-6 flex flex-col gap-3.5">
            <p className="font-sans text-[0.6875rem] font-medium tracking-[0.18em] uppercase text-muted-foreground">Свяжитесь с гидом напрямую</p>
            <div className="flex items-center gap-3.5">
              <ProfileAvatar
                profile={{
                  full_name: guideProfileData?.full_name ?? null,
                  avatar_url: guideAvatarUrl,
                }}
                size={52}
                className="border-2 border-glass-border"
              />
              <div className="flex-1 min-w-0 flex flex-col gap-[0.3rem]">
                <p className="font-sans text-base font-semibold text-foreground flex items-center gap-1.5">
                  {guideName}
                  {isVerified ? (
                    <span
                      className="inline-flex items-center justify-center size-[18px] rounded-full bg-primary text-primary-foreground text-[0.625rem] font-bold shrink-0"
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
                action={async (formData: FormData) => {
                  "use server";
                  const result = await openBookingThreadAction(formData);
                  if (result.error) {
                    redirect("/messages");
                  }
                  redirect(`/messages/${result.threadId}`);
                }}
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

          <SupportSidebar bookingId={booking.id} />

          <Link
            href="/traveler/requests"
            className="font-sans text-sm font-medium text-primary no-underline inline-flex items-center gap-1 hover:underline"
          >
            ← К моим поездкам
          </Link>
        </div>
      </div>
    </div>
  );
}
