"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  ShieldAlert,
  Wallet,
  XCircle,
} from "lucide-react";

import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { ContactReveal } from "@/components/trust/contact-reveal";
import { MoneyBreakdown } from "@/components/trust/money-breakdown";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRubFromMinor, rubToKopecks } from "@/data/money";
import type { BookingRecord } from "@/data/supabase/queries";
import { getTheme } from "@/data/themes";
import { BookingTicketTrigger } from "@/features/bookings/components/booking-ticket-trigger";
import { CancelBookingButton } from "@/features/bookings/components/cancel-booking-button";
import { SupportSidebar } from "@/features/bookings/components/support-sidebar";
import { OpenDisputeButton } from "@/features/disputes/components/open-dispute-button";
import { GuideBookingStatusBadge } from "@/features/guide/components/bookings/guide-booking-status";
import { FourAxisReviewForm } from "@/features/reviews/components/FourAxisReviewForm";
import type { GuideBookingStatus } from "@/data/guide-booking/types";
import type { BookingStatus } from "@/lib/bookings/state-machine";
import { COPY } from "@/lib/copy";
import { formatRussianDateRange, formatRussianTime } from "@/lib/dates";
import { flags } from "@/lib/flags";
import { resolveDisplayName } from "@/lib/profile/resolve-display-name";
import { pluralize } from "@/lib/utils";
import type { BookingWithDetails } from "@/lib/supabase/bookings";
import type { PaymentAgreement } from "@/lib/supabase/payment-agreements";
import { confirmPaymentAgreementAction } from "@/features/bookings/payment-agreement-actions";
import {
  confirmBookingAction,
  completeBookingAction,
  declineBooking,
  noShowBookingAction,
  getGuideBookingDetailAction,
} from "@/app/(protected)/guide/bookings/[bookingId]/actions";

type GuideBookingAction = "confirm" | "complete" | "cancel" | "no_show";
type OpenBookingThreadAction = (
  bookingId: string,
) => Promise<{ threadId?: string; error?: string }>;

/**
 * The listing a ready/fixed excursion booking was made against. Absent for
 * request-first bookings, which carry no excursion programme at all.
 */
export type BookingListing = {
  title?: string | null;
  description?: string | null;
  inclusions?: string[] | null;
  city?: string | null;
};

type BookingDetailScreenProps =
  | {
      viewerRole: "traveler";
      booking: BookingWithDetails;
      existingReview: unknown | null;
      listing?: BookingListing | null;
      paymentAgreement?: PaymentAgreement | null;
      reviewStatus?: string;
      disputeStatus?: string;
      canMessageGuide?: boolean;
      openBookingThreadAction: OpenBookingThreadAction;
    }
  | {
      viewerRole: "guide";
      bookingId: string;
    }
  | {
      viewerRole: "admin";
      booking: BookingWithDetails;
      listing?: BookingListing | null;
      paymentAgreement?: PaymentAgreement | null;
    };

const ACTION_LABEL_RU: Record<string, string> = {
  confirm: "Подтверждение",
  complete: "Завершение",
  cancel: "Отмена",
  no_show: "Неявка",
};

const CANCELLABLE_FOR_TRAVELER: BookingStatus[] = ["pending", "confirmed"];

export function BookingDetailScreen(props: BookingDetailScreenProps) {
  if (props.viewerRole === "guide") {
    return <GuideBookingDetailView bookingId={props.bookingId} />;
  }

  return (
    <TravelerBookingDetailView
      booking={props.booking}
      existingReview={props.viewerRole === "traveler" ? props.existingReview : null}
      listing={props.listing ?? null}
      paymentAgreement={props.paymentAgreement ?? null}
      reviewStatus={props.viewerRole === "traveler" ? props.reviewStatus : undefined}
      disputeStatus={props.viewerRole === "traveler" ? props.disputeStatus : undefined}
      canMessageGuide={props.viewerRole === "traveler" ? (props.canMessageGuide ?? true) : false}
      openBookingThreadAction={
        props.viewerRole === "traveler" ? props.openBookingThreadAction : undefined
      }
      showTravelerPanel={props.viewerRole === "traveler"}
    />
  );
}

function TravelerBookingDetailView({
  booking,
  existingReview,
  listing,
  paymentAgreement,
  reviewStatus,
  disputeStatus,
  canMessageGuide,
  openBookingThreadAction,
  showTravelerPanel,
}: {
  booking: BookingWithDetails;
  existingReview: unknown | null;
  listing?: BookingListing | null;
  paymentAgreement?: PaymentAgreement | null;
  reviewStatus?: string;
  disputeStatus?: string;
  canMessageGuide: boolean;
  openBookingThreadAction?: OpenBookingThreadAction;
  showTravelerPanel: boolean;
}) {
  const router = useRouter();
  const [isOpeningThread, startOpenThread] = React.useTransition();
  const [isConfirmingAgreement, startConfirmAgreement] = React.useTransition();
  const [agreementError, setAgreementError] = React.useState<string | null>(null);

  const handleConfirmAgreement = React.useCallback(() => {
    setAgreementError(null);
    startConfirmAgreement(async () => {
      const result = await confirmPaymentAgreementAction(booking.id);
      if (result.ok) {
        router.refresh();
      } else {
        setAgreementError(result.error ?? "Не удалось подтвердить договорённость.");
      }
    });
  }, [booking.id, router]);

  const guideProfile = booking.guide_profile;
  const guideProfileData = guideProfile?.profile ?? null;
  const guideName = resolveDisplayName("guide", { full_name: guideProfileData?.full_name });
  const guidePhone = booking.guide_phone ?? null;
  const guideAvatarUrl = guideProfileData?.avatar_url ?? null;
  const isVerified = guideProfile?.verification_status === "approved";
  const cancellationPolicy =
    typeof booking.cancellation_policy_snapshot === "string"
      ? booking.cancellation_policy_snapshot
      : undefined;
  const bookingStatusForReveal: "pending" | "confirmed" | "completed" =
    booking.status === "confirmed"
      ? "confirmed"
      : booking.status === "completed"
        ? "completed"
        : "pending";

  const handleOpenThread = React.useCallback(() => {
    if (!openBookingThreadAction) return;
    startOpenThread(async () => {
      const result = await openBookingThreadAction(booking.id);
      router.push(result.threadId ? `/messages/${result.threadId}` : "/messages");
    });
  }, [openBookingThreadAction, booking.id, router]);

  const request = booking.traveler_request;
  const offer = booking.guide_offer;
  // A ready/fixed excursion is exactly a booking made against a listing.
  // Request-first bookings are created by accept_offer with listing_id NULL, so
  // this is the authoritative discriminator — offer text is not.
  const isReadyExcursion = Boolean(booking.listing_id);
  const listingTitle = listing?.title?.trim() || undefined;
  // City: the traveler's own request destination, else the listing's city.
  const city = request?.destination?.trim() || listing?.city?.trim() || "";
  const hasRealDestination = Boolean(city);
  const destination = city || "Маршрут";
  const bookingStartDate = booking.starts_at ?? offer?.starts_at ?? null;
  const bookingEndDate = booking.ends_at ?? offer?.ends_at ?? null;
  const dateRange = bookingStartDate
    ? formatRussianDateRange(bookingStartDate, bookingEndDate)
    : request?.starts_on
      ? formatRussianDateRange(request.starts_on, request.ends_on)
      : "";
  const resolvedListingTitle = listingTitle || (dateRange ? `${destination}, ${dateRange}` : destination);
  // Only surface the destination as a card heading when the H1 already shows a
  // distinct listing title — otherwise it just repeats the page title (F-18).
  const showCardDestination = Boolean(listingTitle) && hasRealDestination;

  const meetingTime = bookingStartDate
    ? formatRussianTime(bookingStartDate)
    : request?.start_time
      ? request.start_time.slice(0, 5)
      : "";
  const meetingPlace = booking.meeting_point ?? null;

  const priceMinor = offer?.price_minor ?? booking.subtotal_minor ?? 0;
  const partySize = booking.party_size ?? offer?.capacity ?? request?.participants_count ?? 1;
  const pricePerPersonMinor = partySize > 1 ? Math.round(priceMinor / partySize) : priceMinor;

  // «Что вас ждёт» describes a fixed excursion programme, which only a listing
  // has. A custom offer's message/title/inclusions are a bid on one traveler's
  // request, and request.notes is the traveler's own text — neither is a programme.
  const inclusions: string[] = isReadyExcursion ? (listing?.inclusions ?? []) : [];
  const description = isReadyExcursion ? listing?.description?.trim() || null : null;

  const interests: string[] = request?.interests ?? [];
  const themeLabels = interests
    .map((slug) => getTheme(slug)?.label)
    .filter(Boolean) as string[];

  const status = toStateMachineStatus(booking.status);
  const canCancel = CANCELLABLE_FOR_TRAVELER.includes(status);
  const canOpenDispute =
    booking.status === "confirmed" || booking.status === "completed";
  const canShowTicket =
    booking.status === "confirmed" ||
    booking.status === "completed" ||
    booking.status === "disputed";

  const messageGuideButton = (primary: boolean) =>
    openBookingThreadAction && canMessageGuide ? (
      <Button
        key="message"
        type="button"
        variant={primary ? "default" : "outline"}
        onClick={handleOpenThread}
        disabled={isOpeningThread}
      >
        {isOpeningThread ? "Открываю чат…" : "Написать гиду"}
      </Button>
    ) : null;

  const ticketButton = canShowTicket ? (
    <BookingTicketTrigger
      key="ticket"
      bookingId={booking.id}
      listingTitle={resolvedListingTitle}
      guideName={guideName}
      guidePhone={guidePhone}
      dateRange={dateRange}
    />
  ) : null;

  const cancelButton = canCancel ? (
    <CancelBookingButton key="cancel" bookingId={booking.id} />
  ) : null;

  const disputeButton =
    flags.FEATURE_TR_DISPUTES && booking.status !== "disputed" && canOpenDispute ? (
      <OpenDisputeButton key="dispute" bookingId={booking.id} />
    ) : null;

  let primaryCTA: React.ReactNode = null;
  let secondaryActions: Array<React.ReactNode> = [];
  if (showTravelerPanel) {
    switch (status) {
      case "confirmed":
        primaryCTA = messageGuideButton(true);
        secondaryActions = [ticketButton, cancelButton, disputeButton];
        break;
      case "completed":
        if (existingReview) {
          primaryCTA = messageGuideButton(true);
          secondaryActions = [ticketButton];
        } else {
          primaryCTA = (
            <Button
              type="button"
              onClick={() =>
                document
                  .getElementById("review-form")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            >
              Оставить отзыв
            </Button>
          );
          secondaryActions = [messageGuideButton(false), ticketButton, disputeButton];
        }
        break;
      case "disputed":
        primaryCTA = messageGuideButton(true);
        secondaryActions = [ticketButton];
        break;
      case "cancelled":
      case "no_show":
        break;
      default:
        // pending / awaiting_guide_confirmation: cancel is the only action.
        primaryCTA = cancelButton;
        break;
    }
  }
  const secondaryButtons = secondaryActions.filter(Boolean);
  const showReviewForm =
    showTravelerPanel && booking.status === "completed" && !existingReview;

  return (
    <div className="flex flex-col gap-6">
      {reviewStatus === "success" ? (
        <Card>
          <CardHeader className="flex flex-col gap-1">
            <CardTitle className="text-base">Отзыв отправлен</CardTitle>
            <p className="text-sm text-muted-foreground">
              Спасибо. Отзыв сохранён и появится в профиле гида.
            </p>
          </CardHeader>
        </Card>
      ) : null}

      {disputeStatus === "success" ? (
        <Card>
          <CardHeader className="flex flex-col gap-1">
            <CardTitle className="text-base">Спор открыт</CardTitle>
            <p className="text-sm text-muted-foreground">
              Мы передали его на рассмотрение и привязали к этой поездке.
            </p>
          </CardHeader>
        </Card>
      ) : null}

      <div className="py-12">
        <div className="mx-auto flex max-w-[640px] flex-col gap-6 px-gutter lg:grid lg:max-w-[1080px] lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-8">
          {/* left: trip content */}
          <div className="flex flex-col gap-6 lg:col-start-1 lg:min-w-0">
            <header className="flex flex-col gap-3">
              <BookingStatusBadge status={status} />
              <PageHeader title={resolvedListingTitle || "Бронирование"} actions={primaryCTA} />
            </header>

            {showTravelerPanel ? (
              <Alert variant="info">
                <AlertDescription>{COPY.payment.bookingNote}</AlertDescription>
              </Alert>
            ) : null}

            <Card>
              <CardContent className="flex flex-col gap-2 p-5">
                <Badge variant="eyebrow">Детали поездки</Badge>
                {showCardDestination ? (
                  <p className="font-display text-xl font-semibold text-foreground leading-[1.2]">{destination}</p>
                ) : null}
                {dateRange ? (
                  <p className="font-sans text-sm text-muted-foreground">
                    {dateRange}{meetingTime ? ` · ${meetingTime}` : ""}
                  </p>
                ) : null}
                {/* Only when a real name resolved — resolveDisplayName's "Локальный
                    гид" fallback is a placeholder, not a booking fact. Price stays in
                    «Стоимость» (MoneyBreakdown) so it is stated once, not twice. */}
                {guideProfileData?.full_name ? (
                  <p className="font-sans text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{COPY.guide}:</span> {guideName}
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
                    {partySize} {pluralize(partySize, "человек", "человека", "человек")}
                    {request?.open_to_join ? " · сборная группа" : ""}
                  </p>
                ) : null}
              </CardContent>
            </Card>

            {(description || inclusions.length > 0) ? (
              <Card>
                <CardContent className="flex flex-col gap-3 p-5">
                  <Badge variant="eyebrow">Что вас ждёт</Badge>
                  {description ? (
                    <p className="font-sans text-sm text-foreground leading-[1.6] whitespace-pre-line">{description}</p>
                  ) : null}
                  {inclusions.length > 0 ? (
                    <div>
                      <p className="font-sans text-xs font-medium text-muted-foreground uppercase tracking-[0.12em] mb-1.5">Включено</p>
                      <ul className="flex flex-col gap-1">
                        {inclusions.map((item) => (
                          <li key={item} className="font-sans text-sm text-foreground flex items-start gap-2">
                            <Check className="size-4 text-primary shrink-0 mt-0.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            {showTravelerPanel ? (
              <>
                {showReviewForm ? (
                  <div id="review-form">
                    <FourAxisReviewForm
                      bookingId={booking.id}
                      guideId={booking.guide_id}
                      listingId={booking.listing_id ?? ""}
                      listingTitle={resolvedListingTitle}
                    />
                  </div>
                ) : null}

                <SupportSidebar bookingId={booking.id} />

                <Link
                  href="/trips"
                  className="font-sans text-sm font-medium text-primary no-underline inline-flex items-center gap-1 hover:underline"
                >
                  <ArrowLeft className="size-4" />
                  К моим поездкам
                </Link>
              </>
            ) : null}
          </div>

          {/* right: money + agreement + contact + actions (sticky on desktop) */}
          <aside className="flex flex-col gap-6 lg:col-start-2 lg:sticky lg:top-24">
            <Card>
              <CardContent className="flex flex-col gap-1.5 p-5">
                <Badge variant="eyebrow">Стоимость</Badge>
                <MoneyBreakdown
                  pricePerPerson={pricePerPersonMinor / 100}
                  partySize={partySize}
                  depositMinor={booking.deposit_minor ?? undefined}
                  remainderMinor={booking.remainder_minor ?? undefined}
                  cancellationPolicy={cancellationPolicy}
                  currency={booking.currency ?? "₽"}
                />
              </CardContent>
            </Card>

            {paymentAgreement ? (
              <Card>
                <CardContent className="flex flex-col gap-3 p-5">
                  <Badge variant="eyebrow">Договорённость об оплате</Badge>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-display text-xl font-semibold text-foreground leading-[1.2]">
                      {formatRubFromMinor(paymentAgreement.agreedTotalMinor)}
                    </span>
                    {paymentAgreement.method === "in_person" ? (
                      <span className="font-sans text-sm text-muted-foreground">Оплата при встрече</span>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <PaymentAgreementRow
                      label="Путешественник"
                      confirmedAt={paymentAgreement.travelerConfirmedAt}
                    />
                    <PaymentAgreementRow
                      label={COPY.guide}
                      confirmedAt={paymentAgreement.guideConfirmedAt}
                    />
                  </div>
                  {showTravelerPanel && !paymentAgreement.travelerConfirmedAt ? (
                    <>
                      {agreementError ? (
                        <Alert variant="destructive">
                          <AlertDescription>{agreementError}</AlertDescription>
                        </Alert>
                      ) : null}
                      <Button
                        type="button"
                        size="lg"
                        onClick={handleConfirmAgreement}
                        disabled={isConfirmingAgreement}
                        className="w-full sm:w-auto"
                      >
                        {isConfirmingAgreement ? "Подтверждаю…" : "Подтвердить договорённость"}
                      </Button>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            {showTravelerPanel ? (
              <>
                <Card>
                  <CardContent className="flex flex-col gap-3.5 p-5">
                    <Badge variant="eyebrow">Свяжитесь с гидом напрямую</Badge>
                    <ContactReveal
                      guide={{
                        name: guideName,
                        avatarUrl: guideAvatarUrl ?? undefined,
                        verified: isVerified,
                      }}
                      contact={{ phone: guidePhone ?? undefined }}
                      bookingStatus={bookingStatusForReveal}
                      contactError={booking.guide_contact_error}
                    />
                  </CardContent>
                </Card>

                {secondaryButtons.length > 0 ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    {secondaryButtons}
                  </div>
                ) : null}
              </>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}

/** Route-level loading placeholder: header + two content cards. */
export function BookingDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton variant="card" className="h-24" />
      <Skeleton variant="card" />
      <Skeleton variant="card" />
    </div>
  );
}

function BookingLoadingCard() {
  return (
    <div className="flex flex-col gap-6">
      <Badge variant="outline">Кабинет гида</Badge>
      <Card>
        <CardHeader className="flex flex-col gap-2">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    </div>
  );
}

function BookingErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <Badge variant="outline">Кабинет гида</Badge>
      <Card>
        <CardHeader className="flex flex-col gap-2">
          <CardTitle>Не удалось загрузить бронирование</CardTitle>
          <p className="text-sm text-muted-foreground">
            Данные не пришли. Попробуйте ещё раз.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" onClick={onRetry}>
            Повторить
          </Button>
          <Button asChild variant="secondary">
            <Link href="/guide/bookings">
              <ArrowLeft className="size-4" />
              Назад к списку
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function GuideBookingDetailView({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [record, setRecord] = React.useState<BookingRecord | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);
  const [actionResult, setActionResult] = React.useState<{
    action: GuideBookingAction;
    nextStatus: GuideBookingStatus;
  } | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const { confirm, ConfirmDialog: confirmDialog } = useConfirm();

  React.useEffect(() => {
    let ignore = false;

    async function load() {
      setIsLoading(true);
      setLoadError(false);
      try {
        const result = await getGuideBookingDetailAction(bookingId);
        if (ignore) return;
        if (result.ok) {
          setRecord(result.booking);
          setErrorMessage(null);
        } else {
          setErrorMessage(result.error);
          setLoadError(true);
        }
      } catch (err) {
        if (!ignore) {
          setErrorMessage(err instanceof Error ? err.message : "Не удалось загрузить бронирование");
          setLoadError(true);
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void load();
    return () => { ignore = true; };
  }, [bookingId, reloadKey]);

  const handleConfirm = React.useCallback(() => {
    if (!record) return;
    setErrorMessage(null);
    startTransition(async () => {
      const result = await confirmBookingAction(bookingId);
      if (result.ok) {
        const refreshed = await getGuideBookingDetailAction(bookingId);
        setRecord((prev) =>
          refreshed.ok ? refreshed.booking : prev ? { ...prev, status: result.status } : prev,
        );
        setActionResult({ action: "confirm", nextStatus: "confirmed" });
        router.refresh();
      } else {
        setErrorMessage(result.error);
      }
    });
  }, [bookingId, record, router]);

  const handleComplete = React.useCallback(() => {
    if (!record) return;
    setErrorMessage(null);
    startTransition(async () => {
      const result = await completeBookingAction(bookingId);
      if (result.ok) {
        const refreshed = await getGuideBookingDetailAction(bookingId);
        setRecord((prev) =>
          refreshed.ok ? refreshed.booking : prev ? { ...prev, status: result.status } : prev,
        );
        setActionResult({ action: "complete", nextStatus: "completed" });
        router.refresh();
      } else {
        setErrorMessage(result.error);
      }
    });
  }, [bookingId, record, router]);

  const performServerAction = React.useCallback(
    (action: Exclude<GuideBookingAction, "confirm" | "complete">) => {
      if (!record) return;
      const currentGuideStatus = mapDbStatusToGuideStatus(record.status);
      const nextStatus = nextStatusForAction(currentGuideStatus, action);
      if (!nextStatus) return;

      setErrorMessage(null);
      startTransition(async () => {
        const result =
          action === "cancel"
            ? await declineBooking(bookingId)
            : await noShowBookingAction(bookingId);
        if (result.ok) {
          const refreshed = await getGuideBookingDetailAction(bookingId);
          setRecord((prev) =>
            refreshed.ok ? refreshed.booking : prev ? { ...prev, status: result.status } : prev,
          );
          setActionResult({ action, nextStatus });
          router.refresh();
        } else {
          setErrorMessage(result.error);
        }
      });
    },
    [bookingId, record, router],
  );

  const handleCancel = React.useCallback(async () => {
    const ok = await confirm({
      title: "Отменить бронирование?",
      description: "Это действие необратимо: бронирование будет отменено.",
      confirmText: "Отменить бронирование",
      cancelText: "Не отменять",
      destructive: true,
    });
    if (ok) performServerAction("cancel");
  }, [confirm, performServerAction]);

  const handleNoShow = React.useCallback(async () => {
    const ok = await confirm({
      title: "Отметить неявку?",
      description: "Гости не явились на экскурсию. Это действие необратимо.",
      confirmText: "Отметить неявку",
      cancelText: "Отмена",
      destructive: true,
    });
    if (ok) performServerAction("no_show");
  }, [confirm, performServerAction]);

  if (isLoading) {
    return <BookingLoadingCard />;
  }

  if (loadError) {
    return <BookingErrorCard onRetry={() => setReloadKey((key) => key + 1)} />;
  }

  if (!record) {
    return (
      <div className="flex flex-col gap-6">
        <Badge variant="outline">Кабинет гида</Badge>
        <Card>
          <CardHeader className="flex flex-col gap-2">
            <CardTitle>Бронирование не найдено</CardTitle>
            <p className="text-sm text-muted-foreground">
              По этому идентификатору нет данных на этом устройстве.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="secondary">
              <Link href="/guide/bookings">
                <ArrowLeft className="size-4" />
                Назад к списку
              </Link>
            </Button>
            <Button asChild>
              <Link href="/guide/inbox">Во входящие запросы</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusTyped = mapDbStatusToGuideStatus(record.status);
  const canConfirm = Boolean(nextStatusForAction(statusTyped, "confirm"));
  const canComplete = Boolean(nextStatusForAction(statusTyped, "complete"));
  const canCancel = Boolean(nextStatusForAction(statusTyped, "cancel"));
  const canNoShow = Boolean(nextStatusForAction(statusTyped, "no_show"));
  const contactRevealed =
    record.status === "confirmed" || record.status === "completed";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <Button asChild variant="ghost" className="-ml-3 px-3">
            <Link href="/guide/bookings">
              <ArrowLeft className="size-4" />
              Бронирования
            </Link>
          </Button>
          <GuideBookingStatusBadge status={statusTyped} />
        </div>

        <div className="flex flex-col gap-2">
          <PageHeader eyebrow="Кабинет гида" title={record.destination} />
          <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-4">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />
              {record.dateLabel}
            </span>
            <span className="inline-flex items-center gap-2">
              <Wallet className="size-4 text-muted-foreground" />
              Выплата: {formatRubFromMinor(rubToKopecks(record.priceRub))}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Модель выплат и залога — демо, без реальных списаний
          </p>
        </div>
      </div>

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {actionResult ? (
        <Alert variant="success" role="status">
          <AlertDescription>
            Статус обновлён:{" "}
            <span className="font-medium">
              {ACTION_LABEL_RU[actionResult.action] ?? actionResult.action}
            </span>{" "}
            →{" "}
            <span className="font-medium">
              {formatStatusLabelForSummary(actionResult.nextStatus)}
            </span>
          </AlertDescription>
        </Alert>
      ) : null}

      {(canConfirm || canComplete || canCancel || canNoShow) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {canConfirm ? (
            <Button
              type="button"
              size="lg"
              disabled={isPending}
              onClick={handleConfirm}
              className="w-full sm:w-auto"
            >
              <CheckCircle2 className="size-4" />
              {isPending ? "Подтверждаю…" : "Подтвердить"}
            </Button>
          ) : null}
          {canComplete ? (
            <Button
              type="button"
              size="lg"
              disabled={isPending}
              onClick={handleComplete}
              className="w-full sm:w-auto"
            >
              <CheckCircle2 className="size-4" />
              {isPending ? "Завершаю…" : "Завершить"}
            </Button>
          ) : null}
          {canCancel ? (
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={isPending}
              onClick={handleCancel}
              className="w-full sm:w-auto"
            >
              <XCircle className="size-4" />
              Отменить
            </Button>
          ) : null}
          {canNoShow ? (
            <Button
              type="button"
              variant="destructive"
              size="lg"
              disabled={isPending}
              onClick={handleNoShow}
              className="w-full sm:w-auto"
            >
              <ShieldAlert className="size-4" />
              Неявка
            </Button>
          ) : null}
        </div>
      )}
      {confirmDialog}

      {contactRevealed ? (
        <Card>
          <CardHeader className="flex flex-col gap-1">
            <CardTitle>Свяжитесь с путешественником</CardTitle>
            <p className="text-sm text-muted-foreground">
              Контакт открыт после подтверждения бронирования.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <p className="font-sans text-base font-semibold text-foreground">
                {record.travelerName ?? "Путешественник"}
              </p>
              {record.travelerPhone ? (
                <p className="font-sans text-sm text-muted-foreground">
                  <span className="font-medium">Телефон:</span>{" "}
                  <a
                    href={`tel:${record.travelerPhone}`}
                    className="text-primary no-underline hover:underline"
                  >
                    {record.travelerPhone}
                  </a>
                </p>
              ) : (
                <p className="font-sans text-sm text-muted-foreground">
                  Контакт появится после подтверждения
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function PaymentAgreementRow({
  label,
  confirmedAt,
}: {
  label: string;
  confirmedAt: string | null;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-sans text-sm text-foreground">{label}</span>
      {confirmedAt ? (
        <span className="inline-flex items-center gap-1 font-sans text-sm font-medium text-success">
          <Check className="size-4 text-success" />
          подтвердил
        </span>
      ) : (
        <span className="font-sans text-sm text-muted-foreground">ожидает</span>
      )}
    </div>
  );
}

function toStateMachineStatus(s: string): BookingStatus {
  const allowed: BookingStatus[] = [
    "pending",
    "confirmed",
    "completed",
    "cancelled",
    "disputed",
    "no_show",
  ];
  if (allowed.includes(s as BookingStatus)) return s as BookingStatus;
  if (s === "awaiting_guide_confirmation") return "pending";
  return "pending";
}

function mapDbStatusToGuideStatus(status: string): GuideBookingStatus {
  switch (status) {
    case "pending":
    case "awaiting_guide_confirmation":
    case "awaiting_confirmation":
      return "awaiting_confirmation";
    case "confirmed":
      return "confirmed";
    case "in_progress":
      return "in_progress";
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    case "no_show":
      return "no_show";
    default:
      return "awaiting_confirmation";
  }
}

function nextStatusForAction(
  current: GuideBookingStatus,
  action: GuideBookingAction,
): GuideBookingStatus | null {
  if (action === "confirm") {
    return current === "awaiting_confirmation" ? "confirmed" : null;
  }

  if (action === "complete") {
    if (current === "confirmed" || current === "in_progress") return "completed";
    return null;
  }

  if (action === "cancel") {
    // Mirror BOOKING_TRANSITIONS: cancellable from DB pending /
    // awaiting_guide_confirmation (→ "awaiting_confirmation") and confirmed.
    if (current === "awaiting_confirmation" || current === "confirmed") {
      return "cancelled";
    }
    return null;
  }

  if (action === "no_show") {
    // BOOKING_TRANSITIONS allows no_show only from DB "confirmed".
    return current === "confirmed" ? "no_show" : null;
  }

  return null;
}

function formatStatusLabelForSummary(status: GuideBookingStatus) {
  switch (status) {
    case "awaiting_confirmation":
      return "Ожидает подтверждения";
    case "confirmed":
      return "Подтверждена";
    case "in_progress":
      return "В процессе";
    case "completed":
      return "Завершена";
    case "cancelled":
      return "Отменена";
    case "no_show":
      return "Неявка";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}
