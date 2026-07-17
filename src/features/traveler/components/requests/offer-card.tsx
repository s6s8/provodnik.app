"use client";

import * as React from "react";
import Image from "next/image";
import { BadgeCheck, CalendarDays, ChevronLeft, ChevronRight, Clock, Lock, Star, Users, Wallet, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { kopecksToRub } from "@/data/money";
import { resolveDisplayName } from "@/lib/profile/resolve-display-name";
import { cn, pluralize } from "@/lib/utils";
import type { GuideOfferRow } from "@/lib/supabase/types";
import type { QaThread } from "@/lib/supabase/qa-threads";

import { AcceptOfferButton } from "./accept-offer-button";
import { RejectOfferButton } from "./reject-offer-button";
import { OfferQaSheet } from "./offer-qa-sheet";

interface GuideInfo {
  guide_id: string;
  full_name: string | null;
  avatar_url: string | null;
  rating: number | null;
  review_count: number | null;
  verified: boolean;
  years_experience: number | null;
  trips_completed: number | null;
  recommend_pct: number | null;
  languages: string[];
  specialties: string[];
}

type RouteStop = { photoId: string; locationName: string; photoUrl: string; sortOrder: number };

interface Props {
  offer: GuideOfferRow;
  guideInfo: GuideInfo | null;
  qaThread: QaThread | null;
  requestId: string;
  requestStatus: string;
  onSendQa: (threadId: string, body: string) => Promise<void>;
  onGetOrCreateQaThread: (offerId: string) => Promise<string>;
  travelerDateLocked?: boolean;
  travelerTimeLocked?: boolean;
  travelerCountLocked?: boolean;
  travelerBudgetLocked?: boolean;
  travelerStartsOn?: string | null;
  travelerStartTime?: string | null;
  travelerEndTime?: string | null;
  travelerOpenToJoin: boolean;
  travelerCount?: number;
  travelerBudgetPerPersonRub?: number | null;
  /** Embedded under a GuideOfferCard: hide the duplicate guide header + inline accept
   * (commit happens from the sticky action bar); keep details, reject and Q&A. */
  embedded?: boolean;
}

const BADGE_BASE = "text-xs font-medium normal-case tracking-normal";
const DEVIATION_BADGE = cn(BADGE_BASE, "border-amber/40 bg-amber-tint text-amber");
const NEUTRAL_BADGE = cn(BADGE_BASE, "border-border bg-surface-low text-muted-foreground");
const SUCCESS_BADGE = cn(BADGE_BASE, "border-success/30 bg-success/10 text-success");

function formatPrice(minor: number, currency: string): string {
  return formatRub(kopecksToRub(minor), currency);
}

function formatRub(rub: number, currency: string): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(rub);
}

function formatDateRu(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

function formatOfferDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const date = d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  const time = d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  return `Ответил ${date}, ${time}`;
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 5);
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Moscow" });
}

function normalizeTime(value: string | null | undefined): string | null {
  return value ? value.slice(0, 5) : null;
}

export function OfferCard({
  offer,
  guideInfo,
  qaThread,
  requestId,
  requestStatus,
  onSendQa,
  onGetOrCreateQaThread,
  travelerStartsOn,
  travelerStartTime,
  travelerEndTime,
  travelerOpenToJoin,
  travelerCount,
  travelerBudgetPerPersonRub,
  embedded = false,
}: Props) {
  const guideName = resolveDisplayName("guide", { full_name: guideInfo?.full_name ?? null });
  const guideRating = guideInfo?.rating ?? null;
  const showGuideRating = guideRating != null && guideRating > 0;
  const canAccept = requestStatus === "open" && offer.status === "pending";

  const offerCount = offer.capacity > 0 ? offer.capacity : (travelerCount ?? 1);
  const perPersonMinor = offerCount > 0 ? Math.round(offer.price_minor / offerCount) : offer.price_minor;
  const priceGroupLabel = formatPrice(offer.price_minor, offer.currency);
  const priceLabel = `${priceGroupLabel} за группу · ${formatPrice(perPersonMinor, offer.currency)} на чел.`;

  const offerDateIso = offer.starts_at ? offer.starts_at.slice(0, 10) : null;
  const dateBadgeLabel = formatDateRu(offer.starts_at);
  const timeBadgeLabel = offer.starts_at && offer.ends_at
    ? `${formatTime(offer.starts_at)} – ${formatTime(offer.ends_at)}`
    : offer.starts_at
      ? formatTime(offer.starts_at)
      : "—";
  const countBadgeLabel = `${offerCount} чел.`;

  const dateDeviates =
    offerDateIso != null && (travelerStartsOn == null || offerDateIso !== travelerStartsOn.slice(0, 10));
  const timeDeviates =
    (travelerStartTime != null && offer.starts_at != null && formatTime(offer.starts_at) !== normalizeTime(travelerStartTime)) ||
    (travelerEndTime != null && offer.ends_at != null && formatTime(offer.ends_at) !== normalizeTime(travelerEndTime));
  const countDeviates =
    offer.capacity > 0 && (travelerCount == null || offerCount !== travelerCount);
  const budgetDeviates =
    perPersonMinor > 0 && (travelerBudgetPerPersonRub == null || Math.round(perPersonMinor / 100) !== travelerBudgetPerPersonRub);

  const isCounterOffer = dateDeviates || timeDeviates || countDeviates || budgetDeviates;
  const privateGroupCount = travelerCount ?? offerCount;
  const groupTypeLabel = travelerOpenToJoin ? "Сборная группа" : `Своя группа · ${privateGroupCount} чел.`;

  const routeStops = (Array.isArray(offer.route_stops) ? (offer.route_stops as RouteStop[]) : []).filter(
    (s) => s && typeof s === "object" && typeof s.photoUrl === "string",
  );
  const hasRoute = routeStops.length > 0;

  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);
  const lightboxOpen = lightboxIndex != null;
  const closeLightbox = React.useCallback(() => setLightboxIndex(null), []);
  const showPrev = React.useCallback(() => {
    setLightboxIndex((i) => (i == null ? null : (i - 1 + routeStops.length) % routeStops.length));
  }, [routeStops.length]);
  const showNext = React.useCallback(() => {
    setLightboxIndex((i) => (i == null ? null : (i + 1) % routeStops.length));
  }, [routeStops.length]);

  React.useEffect(() => {
    if (!lightboxOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") showPrev();
      else if (e.key === "ArrowRight") showNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, closeLightbox, showPrev, showNext]);

  const touchStartX = React.useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current;
    const end = e.changedTouches[0]?.clientX ?? null;
    if (start == null || end == null) return;
    const dx = end - start;
    if (Math.abs(dx) > 40) {
      if (dx > 0) showPrev();
      else showNext();
    }
    touchStartX.current = null;
  };

  return (
    <div className={embedded ? "flex flex-col gap-3" : "flex flex-col gap-3 rounded-xl border p-4 bg-card"}>
      {/* Guide header — hidden when embedded under a GuideOfferCard */}
      {embedded ? null : (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={guideInfo?.avatar_url ?? undefined} alt={guideName} />
            <AvatarFallback>{guideName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="font-medium">{guideName}</p>
              {guideInfo?.verified ? (
                <Badge variant="outline" className={cn(SUCCESS_BADGE, "shrink-0")}>
                  <BadgeCheck className="size-3.5" />
                  Проверен
                </Badge>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              {showGuideRating ? (
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <Star className="size-3.5 fill-primary text-primary" />
                  {guideRating.toFixed(1)}
                  {guideInfo?.review_count
                    ? ` · ${guideInfo.review_count} ${pluralize(guideInfo.review_count, "отзыв", "отзыва", "отзывов")}`
                    : ""}
                </span>
              ) : null}
              <span>{formatOfferDate(offer.created_at)}</span>
            </div>
          </div>
          {offer.status === "accepted" ? (
            <Badge variant="default">Принято</Badge>
          ) : null}
        </div>
      )}

      {isCounterOffer ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-amber">Гид предложил другие условия</span>
        </div>
      ) : null}

      {/* Badge strip */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className={cn(
            BADGE_BASE,
            travelerOpenToJoin
              ? "border-primary/20 bg-primary-tint text-primary"
              : "border-border bg-surface-low text-muted-foreground",
          )}
        >
          {travelerOpenToJoin ? null : <Lock className="size-3.5" />}
          {groupTypeLabel}
        </Badge>
        {travelerStartsOn == null ? (
          <Badge variant="outline" className={NEUTRAL_BADGE}>
            Гибкие даты
          </Badge>
        ) : null}
        <Badge variant="outline" className={dateDeviates ? DEVIATION_BADGE : NEUTRAL_BADGE}>
          <CalendarDays className="size-3.5" />
          {dateBadgeLabel}
        </Badge>
        <Badge variant="outline" className={timeDeviates ? DEVIATION_BADGE : NEUTRAL_BADGE}>
          <Clock className="size-3.5" />
          {timeBadgeLabel}
        </Badge>
        <Badge variant="outline" className={countDeviates ? DEVIATION_BADGE : NEUTRAL_BADGE}>
          <Users className="size-3.5" />
          {countBadgeLabel}
        </Badge>
        <Badge
          variant="outline"
          className={budgetDeviates ? DEVIATION_BADGE : SUCCESS_BADGE}
        >
          <Wallet className="size-3.5" />
          {priceLabel}
        </Badge>
      </div>

      {/* Route collage */}
      {hasRoute ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-foreground">Маршрут</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {routeStops.map((stop, idx) => (
              <button
                key={`${stop.photoId}-${idx}`}
                type="button"
                onClick={() => setLightboxIndex(idx)}
                className="relative flex-shrink-0 overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label={`Открыть фото: ${stop.locationName}`}
              >
                <Image
                  src={stop.photoUrl}
                  alt={stop.locationName}
                  width={96}
                  height={96}
                  className="size-24 object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-foreground/50 px-1 py-0.5">
                  <p className="truncate text-xs text-primary-foreground">{stop.locationName}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Inclusions */}
      {Array.isArray(offer.inclusions) && offer.inclusions.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-foreground">Что входит в цену</p>
          <div className="flex flex-wrap gap-1.5">
            {offer.inclusions.map((label, idx) => (
              <Badge
                key={`${label}-${idx}`}
                variant="outline"
                className={SUCCESS_BADGE}
              >
                ✓ {label}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {/* Offer message */}
      {offer.message ? (
        <div className="rounded-lg border bg-background/60 p-3">
          <p className="mb-1 text-xs text-muted-foreground">Сообщение гида</p>
          <p className="text-sm whitespace-pre-line">{offer.message}</p>
        </div>
      ) : null}

      {/* Contact disclosure — shown once the traveler accepts this offer.
          The pending «контакты скрыты» note now lives once above the offer list. */}
      {offer.status === "accepted" ? (
        <div className="rounded-md border border-success/30 bg-success/10 px-3 py-2">
          <p className="text-xs text-success">
            Вы выбрали этого гида. Контактные данные открыты — напишите гиду,
            чтобы согласовать детали.
          </p>
        </div>
      ) : null}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {canAccept ? (
          <>
            {embedded ? null : (
              <AcceptOfferButton offerId={offer.id} guideName={guideName} />
            )}
            <RejectOfferButton offerId={offer.id} requestId={requestId} />
          </>
        ) : null}

        <OfferQaSheet
          offerId={offer.id}
          initialThread={qaThread}
          onSend={onSendQa}
          onGetOrCreate={onGetOrCreateQaThread}
        />
      </div>

      {/* Lightbox */}
      {lightboxOpen ? (
        <>
          <div
            className="fixed inset-0 z-[130] bg-foreground/80"
            onClick={closeLightbox}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Фото маршрута ${(lightboxIndex ?? 0) + 1} из ${routeStops.length}`}
            className="fixed inset-0 z-[140] flex items-center justify-center"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                closeLightbox();
              }}
              aria-label="Закрыть"
              className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-foreground/40 text-primary-foreground hover:bg-foreground/60"
            >
              <X className="size-5" />
            </button>
            {routeStops.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    showPrev();
                  }}
                  aria-label="Предыдущее"
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-foreground/40 text-primary-foreground hover:bg-foreground/60"
                >
                  <ChevronLeft className="size-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    showNext();
                  }}
                  aria-label="Следующее"
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-foreground/40 text-primary-foreground hover:bg-foreground/60"
                >
                  <ChevronRight className="size-6" />
                </button>
              </>
            ) : null}
            <div className="relative max-h-[88vh] max-w-[92vw]">
              <Image
                src={routeStops[lightboxIndex ?? 0].photoUrl}
                alt={routeStops[lightboxIndex ?? 0].locationName}
                width={1600}
                height={1200}
                className="max-h-[88vh] w-auto max-w-[92vw] object-contain"
                unoptimized
              />
              <p className="absolute inset-x-0 bottom-2 text-center text-sm text-primary-foreground drop-shadow">
                {routeStops[lightboxIndex ?? 0].locationName}
              </p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
