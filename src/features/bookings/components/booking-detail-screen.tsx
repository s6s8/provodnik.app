"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  MapPin,
  ShieldAlert,
  XCircle,
} from "lucide-react";

import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { ProfileAvatar } from "@/components/profile-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
import { flags } from "@/lib/flags";
import { resolveDisplayName } from "@/lib/profile/resolve-display-name";
import type { BookingWithDetails } from "@/lib/supabase/bookings";
import { cn } from "@/lib/utils";
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

type BookingDetailScreenProps =
  | {
      viewerRole: "traveler";
      booking: BookingWithDetails;
      existingReview: unknown | null;
      listingTitle?: string;
      reviewStatus?: string;
      disputeStatus?: string;
      openBookingThreadAction: OpenBookingThreadAction;
    }
  | {
      viewerRole: "guide";
      bookingId: string;
    }
  | {
      viewerRole: "admin";
      booking: BookingWithDetails;
      listingTitle?: string;
    };

const ACTION_LABEL_RU: Record<string, string> = {
  confirm: "Подтверждение",
  complete: "Завершение",
  cancel: "Отмена",
  no_show: "Неявка",
};

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

export function BookingDetailScreen(props: BookingDetailScreenProps) {
  if (props.viewerRole === "guide") {
    return <GuideBookingDetailView bookingId={props.bookingId} />;
  }

  return (
    <TravelerBookingDetailView
      booking={props.booking}
      existingReview={props.viewerRole === "traveler" ? props.existingReview : null}
      listingTitle={props.listingTitle}
      reviewStatus={props.viewerRole === "traveler" ? props.reviewStatus : undefined}
      disputeStatus={props.viewerRole === "traveler" ? props.disputeStatus : undefined}
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
  listingTitle,
  reviewStatus,
  disputeStatus,
  openBookingThreadAction,
  showTravelerPanel,
}: {
  booking: BookingWithDetails;
  existingReview: unknown | null;
  listingTitle?: string;
  reviewStatus?: string;
  disputeStatus?: string;
  openBookingThreadAction?: OpenBookingThreadAction;
  showTravelerPanel: boolean;
}) {
  const router = useRouter();
  const [isOpeningThread, startOpenThread] = React.useTransition();

  const guideProfile = booking.guide_profile;
  const guideProfileData = guideProfile?.profile ?? null;
  const guideName = resolveDisplayName("guide", { full_name: guideProfileData?.full_name });
  const guidePhone = booking.guide_phone ?? null;
  const guideAvatarUrl = guideProfileData?.avatar_url ?? null;
  const isVerified = guideProfile?.verification_status === "approved";

  const handleOpenThread = React.useCallback(() => {
    if (!openBookingThreadAction) return;
    startOpenThread(async () => {
      const result = await openBookingThreadAction(booking.id);
      router.push(result.threadId ? `/messages/${result.threadId}` : "/messages");
    });
  }, [openBookingThreadAction, booking.id, router]);

  const request = booking.traveler_request;
  const offer = booking.guide_offer;
  const destination = request?.destination ?? "Маршрут";
  const dateRange = formatDateRange(
    request?.starts_on ?? null,
    request?.ends_on ?? null,
  );
  const resolvedListingTitle = listingTitle || (dateRange ? `${destination}, ${dateRange}` : destination);

  const meetingTime = formatTime(offer?.starts_at ?? request?.start_time);
  const meetingPlace = booking.meeting_point ?? null;

  const priceMinor = offer?.price_minor ?? booking.subtotal_minor ?? 0;
  const partySize = booking.party_size ?? request?.participants_count ?? 1;
  const pricePerPersonMinor = partySize > 1 ? Math.round(priceMinor / partySize) : priceMinor;

  const inclusions: string[] = offer?.inclusions ?? [];
  const description = offer?.message || request?.notes || null;

  const interests: string[] = request?.interests ?? [];
  const themeLabels = interests
    .map((slug) => getTheme(slug)?.label)
    .filter(Boolean) as string[];

  const status = toStateMachineStatus(booking.status);
  const canCancel = CANCELLABLE_FOR_TRAVELER.includes(status);
  const canOpenDispute =
    booking.status === "confirmed" || booking.status === "completed";

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
          <div className="flex items-start gap-3 flex-wrap justify-between">
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="font-display text-[clamp(1.875rem,4vw,2.5rem)] font-semibold leading-[1.05] text-foreground">{BOOKING_HEADINGS[status]}</h1>
              <BookingStatusBadge status={status} />
            </div>
            {showTravelerPanel && canCancel ? <CancelBookingButton bookingId={booking.id} /> : null}
          </div>

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

          {showTravelerPanel ? (
            <>
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
                    ) : (
                      <p className="font-sans text-sm text-muted-foreground">
                        Контакт появится в чате
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  {openBookingThreadAction ? (
                    <Button
                      type="button"
                      onClick={handleOpenThread}
                      disabled={isOpeningThread}
                    >
                      {isOpeningThread ? "Открываю чат…" : "Написать гиду"}
                    </Button>
                  ) : null}

                  {(booking.status === "confirmed" || booking.status === "completed") ? (
                    <BookingTicketTrigger
                      bookingId={booking.id}
                      listingTitle={resolvedListingTitle}
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
                  listingTitle={resolvedListingTitle}
                />
              ) : null}

              <SupportSidebar bookingId={booking.id} />

              <Link
                href="/trips"
                className="font-sans text-sm font-medium text-primary no-underline inline-flex items-center gap-1 hover:underline"
              >
                ← К моим поездкам
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BookingLoadingCard() {
  return (
    <div className="space-y-6">
      <Badge variant="outline">Кабинет гида</Badge>
      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-2">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-3">
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
    <div className="space-y-6">
      <Badge variant="outline">Кабинет гида</Badge>
      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-2">
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

  if (isLoading) {
    return <BookingLoadingCard />;
  }

  if (loadError) {
    return <BookingErrorCard onRetry={() => setReloadKey((key) => key + 1)} />;
  }

  if (!record) {
    return (
      <div className="space-y-6">
        <Badge variant="outline">Кабинет гида</Badge>
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-2">
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
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Button asChild variant="ghost" className="-ml-3 px-3">
            <Link href="/guide/bookings">
              <ArrowLeft className="size-4" />
              Бронирования
            </Link>
          </Button>
          <GuideBookingStatusBadge status={statusTyped} />
        </div>

        <div className="space-y-2">
          <Badge variant="outline">Кабинет гида</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {record.destination}
          </h1>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-4">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />
              {record.dateLabel}
            </span>
            {process.env.NODE_ENV !== "production" && (
              <span className="inline-flex items-center gap-2">
                <MapPin className="size-4 text-muted-foreground" />
                Модель выплат и залога — демо, без реальных списаний
              </span>
            )}
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {errorMessage}
        </div>
      ) : null}

      {actionResult ? (
        <div className="rounded-lg border border-border/70 bg-background/60 p-3 text-sm text-muted-foreground">
          Статус обновлён:{" "}
          <span className="font-medium text-foreground">
            {ACTION_LABEL_RU[actionResult.action] ?? actionResult.action}
          </span>{" "}
          →{" "}
          <span className="font-medium text-foreground">
            {formatStatusLabelForSummary(actionResult.nextStatus)}
          </span>
        </div>
      ) : null}

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle>Операции по бронированию</CardTitle>
          <p className="text-sm text-muted-foreground">
            Фиксируйте, как идёт экскурсия: подтверждение, завершение, отмены и неявки.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <ActionButton
              label={isPending ? "Подтверждаю…" : "Подтвердить"}
              description="Закрепить экскурсию и ожидать гостей."
              icon={<CheckCircle2 className="size-4" />}
              disabled={!canConfirm || isPending}
              onClick={handleConfirm}
            />
            <ActionButton
              label={isPending ? "Завершаю…" : "Завершить"}
              description="Отметить экскурсию как проведённую."
              icon={<CheckCircle2 className="size-4" />}
              disabled={!canComplete || isPending}
              onClick={handleComplete}
            />
            <ActionButton
              label="Отменить"
              description="Зафиксировать отмену со стороны гида или гостя."
              icon={<XCircle className="size-4" />}
              disabled={!canCancel || isPending}
              onClick={() => performServerAction("cancel")}
            />
            <ActionButton
              label="Неявка"
              description="Гости не пришли к старту экскурсии."
              icon={<ShieldAlert className="size-4" />}
              disabled={!canNoShow || isPending}
              onClick={() => performServerAction("no_show")}
            />
          </div>

          {process.env.NODE_ENV !== "production" && (
            <>
              <Separator />

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button className="w-full sm:w-auto" disabled>
                  <CreditCard className="size-4" />
                  Взять залог (демо)
                </Button>
                <Button className="w-full sm:w-auto" variant="secondary" disabled>
                  Выплата гиду (демо)
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {contactRevealed ? (
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-1">
            <CardTitle>Свяжитесь с путешественником</CardTitle>
            <p className="text-sm text-muted-foreground">
              Контакт открыт после подтверждения бронирования.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-[0.3rem]">
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

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle>Деньги</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ориентировочная экономика экскурсии. В этой версии нет реальных платежей.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard
              label="Сумма по экскурсии"
              value={formatRubForGuide(record.priceRub)}
              helper="Ориентировочная стоимость"
            />
            <StatCard
              label="Статус"
              value={formatStatusLabelForSummary(mapDbStatusToGuideStatus(record.status))}
              helper={record.title}
            />
            {!contactRevealed ? (
              <StatCard
                label="Путешественник"
                value={record.travelerName ?? "Путешественник"}
                helper="Имя и контакт раскрываются после подтверждения"
              />
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ActionButton({
  label,
  description,
  icon,
  disabled,
  onClick,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group flex w-full flex-col items-start gap-2 rounded-xl border border-border/70 bg-background/60 p-4 text-left transition-colors",
        "hover:bg-background disabled:cursor-not-allowed disabled:opacity-60",
      )}
      aria-label={label}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="inline-flex size-7 items-center justify-center rounded-md border border-border/70 bg-background">
          {icon}
        </span>
        {label}
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </button>
  );
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}

function formatRub(minorUnits: number) {
  const rub = Math.round(minorUnits / 100);
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(rub);
}

function formatRubForGuide(amount: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    currencyDisplay: "symbol",
    maximumFractionDigits: 0,
  }).format(amount);
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
    if (current === "completed" || current === "cancelled" || current === "no_show") {
      return null;
    }
    return "cancelled";
  }

  if (action === "no_show") {
    if (current === "completed" || current === "cancelled") return null;
    return "no_show";
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
