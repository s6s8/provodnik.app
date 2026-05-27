"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Eye, Users } from "lucide-react";

import { INTEREST_CHIPS } from "@/data/interests";
import type { RequestRecord } from "@/data/supabase/queries";
import { formatGroupLine } from "@/data/requests-format";
import { formatTimeRange } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { BidFormPanel } from "./bid-form-panel";
import { GuideOfferQaPanel } from "./guide-offer-qa-panel";

const INTEREST_LABEL_BY_ID: Record<string, string> = Object.fromEntries(
  INTEREST_CHIPS.map(({ id, label }) => [id, label]),
);

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ru-RU", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  request: RequestRecord;
  isApproved: boolean;
  existingOfferId: string | null;
  competingOffers: number;
  viewsCount: number;
}

function formatViewsLabel(count: number): string {
  if (count <= 0) return "Вы первый, кто открыл этот запрос";
  const mod10 = count % 10;
  const mod100 = count % 100;
  let noun = "гидов";
  if (mod10 === 1 && mod100 !== 11) noun = "гид";
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) noun = "гида";
  const verb = noun === "гид" ? "посмотрел" : "посмотрели";
  return `${count} ${noun} ${verb} этот запрос`;
}

function formatCompetingOffersLabel(count: number, hasOwnOffer: boolean): string {
  const others = hasOwnOffer ? Math.max(0, count - 1) : count;
  if (others <= 0) {
    return hasOwnOffer
      ? "Вы пока единственный гид"
      : "Пока ни одного предложения";
  }
  const mod10 = others % 10;
  const mod100 = others % 100;
  let noun = "гидов";
  if (mod10 === 1 && mod100 !== 11) noun = "гид";
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) noun = "гида";
  const verb = noun === "гид" ? "уже отправил предложение" : "уже отправили предложения";
  return `${others} ${noun} ${verb}`;
}

export function GuideRequestDetailScreen({
  request,
  isApproved,
  existingOfferId,
  competingOffers,
  viewsCount,
}: Props) {
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [offerId, setOfferId] = React.useState<string | null>(existingOfferId);

  const interestsLabel = request.interests
    .map((s) => INTEREST_LABEL_BY_ID[s] ?? s)
    .join(" · ");

  return (
    <div className="space-y-6">
      <Link
        href="/guide/inbox"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Назад к запросам
      </Link>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-2">
          <div className="flex items-start gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/10 text-primary text-base font-bold"
              aria-hidden="true"
            >
              {request.requesterInitials}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg">{request.requesterName}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {request.format ? <>{request.format} </> : null}в{" "}
                <span className="font-medium text-foreground">
                  {request.destination}
                </span>
              </p>
            </div>
            <p className="text-xs text-muted-foreground shrink-0">
              {formatDateTime(request.createdAt)}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {interestsLabel ? (
            <div>
              <span className="inline-flex items-center gap-1.5 whitespace-normal rounded-full bg-primary/10 px-2.5 py-1 font-sans text-[11px] font-semibold tracking-[0.02em] text-primary">
                {interestsLabel}
              </span>
            </div>
          ) : null}

          <p className="text-sm text-muted-foreground">
            {formatGroupLine(request)}
          </p>

          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <p>
              <span className="font-medium text-foreground">Даты:</span>{" "}
              {request.dateLabel}
              {request.dateFlexibility && request.dateFlexibility !== "exact" && (
                <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {request.dateFlexibility === "few_days"
                    ? "±пара дней"
                    : "±неделя"}
                </span>
              )}
            </p>
            {formatTimeRange(request.startTime, request.endTime) && (
              <p>
                <span className="font-medium text-foreground">Время:</span>{" "}
                {formatTimeRange(request.startTime, request.endTime)}
              </p>
            )}
            <p className="sm:col-span-2">
              <span className="font-medium text-foreground">Бюджет:</span>{" "}
              {request.budgetLabel}
            </p>
          </div>

          <div className="border-t border-border/50 pt-4">
            <p className="text-sm font-medium text-foreground">
              Описание от путешественника
            </p>
            {request.description ? (
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                {request.description}
              </p>
            ) : (
              <p className="mt-2 text-sm italic text-muted-foreground/70">
                Путешественник не оставил описание. Используйте детали выше,
                чтобы составить предложение.
              </p>
            )}
          </div>

          <div
            className="flex flex-col gap-1.5 rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm text-muted-foreground"
            aria-live="polite"
          >
            <div className="flex items-center gap-2">
              <Eye className="size-4 shrink-0" aria-hidden="true" />
              <span>{formatViewsLabel(viewsCount)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="size-4 shrink-0" aria-hidden="true" />
              <span>{formatCompetingOffersLabel(competingOffers, offerId !== null)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {offerId ? (
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-primary/10 px-3.5 py-1.5 font-sans text-xs font-semibold tracking-[0.02em] text-primary">
                ✓ Предложение отправлено
              </span>
            ) : isApproved ? (
              <Button
                variant="default"
                size="default"
                onClick={() => setPanelOpen(true)}
              >
                Сделать предложение
              </Button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="default" size="default" disabled>
                  Доступно после верификации
                </Button>
                <Link
                  href="/guide/verification"
                  className="text-xs text-primary underline-offset-2 hover:underline"
                >
                  Пройти верификацию →
                </Link>
              </div>
            )}
          </div>

          {offerId ? (
            <div className="mt-2 border-t border-border/50 pt-4">
              <GuideOfferQaPanel offerId={offerId} />
            </div>
          ) : null}
        </CardContent>
      </Card>

      {panelOpen ? (
        <BidFormPanel
          requestId={request.id}
          request={request}
          onClose={() => setPanelOpen(false)}
          onSuccess={() => {
            setOfferId("pending");
          }}
        />
      ) : null}
    </div>
  );
}
