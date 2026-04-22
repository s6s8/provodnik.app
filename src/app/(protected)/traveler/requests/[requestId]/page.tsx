import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type {
  TravelerRequestRecord,
  TravelerRequestStatus,
} from "@/data/traveler-request/types";
import { AcceptOfferButton } from "@/features/traveler/components/requests/accept-offer-button";
import { TravelerRequestDetailScreen } from "@/features/traveler/components/requests/traveler-request-detail-screen";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOffersForRequest } from "@/lib/supabase/offers";
import type {
  GuideOfferRow,
  RequestStatus,
  TravelerRequestRow,
} from "@/lib/supabase/types";

import { openOfferThreadAction } from "./actions";

export const metadata: Metadata = {
  title: "Запрос",
};

const travelerRequestSelect =
  "id, traveler_id, destination, region, interests, starts_on, ends_on, start_time, end_time, budget_minor, currency, participants_count, format_preference, notes, open_to_join, allow_guide_suggestions, group_capacity, status, created_at, updated_at";

function mapRequestStatus(status: RequestStatus): TravelerRequestStatus {
  switch (status) {
    case "open":
      return "submitted";
    case "booked":
      return "booked";
    case "cancelled":
    case "expired":
      return "closed";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

function mapTravelerRequestRow(row: TravelerRequestRow): TravelerRequestRecord {
  const mode = row.format_preference === "group" ? "assembly" : "private";

  return {
    id: row.id,
    status: mapRequestStatus(row.status),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    request: {
      mode,
      interests: Array.isArray(row.interests) ? row.interests : [],
      destination: row.destination,
      startDate: row.starts_on,
      startTime: row.start_time ? row.start_time.slice(0, 5) : undefined,
      endTime: row.end_time ? row.end_time.slice(0, 5) : undefined,
      ...(mode === "assembly"
        ? { groupSizeCurrent: row.participants_count, groupMax: row.group_capacity ?? undefined }
        : { groupSize: row.participants_count }),
      allowGuideSuggestionsOutsideConstraints: row.allow_guide_suggestions,
      budgetPerPersonRub: row.budget_minor ?? 0,
      notes: row.notes ?? undefined,
    },
  };
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

function formatDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface OffersSectionProps {
  offers: GuideOfferRow[];
  requestId: string;
  canAccept: boolean;
  guideNames: Record<string, string | null>;
}

function OffersSection({
  offers,
  requestId,
  canAccept,
  guideNames,
}: OffersSectionProps) {
  const pendingOffers = offers.filter((o) => o.status === "pending");

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h2 className="font-display text-[clamp(1.25rem,2.5vw,1.5rem)] font-semibold leading-[1.1] text-foreground">
          Предложения гидов
        </h2>
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary/12 px-1.5 font-sans text-xs font-semibold text-primary">
          {pendingOffers.length}
        </span>
      </div>

      {pendingOffers.length === 0 ? (
        <div className="rounded-glass border border-glass-border bg-glass p-6 shadow-glass backdrop-blur-[20px]">
          <p className="font-sans text-sm leading-[1.6] text-muted-foreground">
            Пока нет предложений. Гиды увидят ваш запрос и ответят в ближайшее
            время.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {pendingOffers.map((offer) => (
            <article
              key={offer.id}
              className="flex flex-col gap-4 rounded-glass border border-glass-border bg-glass p-5 shadow-glass backdrop-blur-[20px]"
            >
              <div className="flex items-center gap-3">
                <Avatar className="size-11 border-2 border-glass-border">
                  <AvatarFallback className="bg-surface-low text-sm font-semibold text-primary">
                    {(guideNames[offer.guide_id] ?? "Г")
                      .charAt(0)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-sans text-[0.9375rem] font-semibold text-foreground">
                    {guideNames[offer.guide_id] ?? "Гид"}
                  </p>
                  {offer.expires_at ? (
                    <p className="mt-0.5 font-sans text-xs text-muted-foreground">
                      До {formatDate(offer.expires_at)}
                    </p>
                  ) : null}
                </div>
                <p className="shrink-0 whitespace-nowrap font-sans text-[1.0625rem] font-semibold text-foreground">
                  {formatRub(offer.price_minor)}
                </p>
              </div>

              {offer.message ? (
                <p className="rounded-[12px] border border-glass-border bg-surface/50 p-3 font-sans text-sm leading-[1.6] text-muted-foreground">
                  {offer.message}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                {canAccept ? (
                  <AcceptOfferButton
                    offerId={offer.id}
                    requestId={requestId}
                    guideId={offer.guide_id}
                    priceMinor={offer.price_minor}
                  />
                ) : null}
                <form action={openOfferThreadAction}>
                  <input type="hidden" name="offer_id" value={offer.id} />
                  <Button type="submit" variant="outline">
                    Написать гиду
                  </Button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function TravelerRequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ requestId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { requestId } = await params;
  const sp = await searchParams;
  const justCreated = sp.created === "1";
  const createdMode = typeof sp.mode === "string" ? sp.mode : null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) notFound();

    const { data, error } = await supabase
      .from("traveler_requests")
      .select(travelerRequestSelect)
      .eq("id", requestId)
      .eq("traveler_id", user.id)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!data) notFound();

    const requestRow = data as TravelerRequestRow;
    const isOwner = requestRow.traveler_id === user.id;
    const isOpen = requestRow.status === "open";
    const canAccept = isOwner && isOpen;

    // Fetch offers in parallel
    let offers: GuideOfferRow[] = [];
    const guideNames: Record<string, string | null> = {};

    try {
      offers = await getOffersForRequest(requestId);

      if (offers.length > 0) {
        const guideIds = [...new Set(offers.map((o) => o.guide_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", guideIds);

        if (profiles) {
          for (const p of profiles) {
            guideNames[p.id] = p.full_name;
          }
        }
      }
    } catch {
      // Non-fatal — render page without offers
    }

    return (
      <div className="flex flex-col gap-8">
        {justCreated ? (
          <div className="rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
            {createdMode === "assembly"
              ? "Сборная экскурсия опубликована — гиды увидят ваш запрос и смогут присоединиться."
              : "Запрос отправлен — гиды получат уведомление и ответят в ближайшее время."}
          </div>
        ) : null}
        <TravelerRequestDetailScreen
          record={mapTravelerRequestRow(requestRow)}
        />
        <OffersSection
          offers={offers}
          requestId={requestId}
          canAccept={canAccept}
          guideNames={guideNames}
        />
      </div>
    );
  } catch {
    notFound();
  }
}
