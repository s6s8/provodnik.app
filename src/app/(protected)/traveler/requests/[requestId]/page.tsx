import { notFound } from "next/navigation";

import type { TravelerRequest } from "@/data/traveler-request/schema";
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

const travelerRequestSelect =
  "id, traveler_id, destination, region, category, starts_on, ends_on, budget_minor, currency, participants_count, format_preference, notes, open_to_join, allow_guide_suggestions, group_capacity, status, created_at, updated_at";

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

function mapCategoryToExperienceType(
  category: string,
): TravelerRequest["experienceType"] {
  if (
    category === "city" ||
    category === "nature" ||
    category === "culture" ||
    category === "food" ||
    category === "adventure" ||
    category === "relax"
  ) {
    return category;
  }

  return "city";
}

function mapTravelerRequestRow(row: TravelerRequestRow): TravelerRequestRecord {
  const startsOn = row.starts_on;
  const endsOn = row.ends_on ?? row.starts_on;

  return {
    id: row.id,
    status: mapRequestStatus(row.status),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    request: {
      experienceType: mapCategoryToExperienceType(row.category),
      destination: row.destination,
      startDate: startsOn,
      endDate: endsOn,
      groupSize: row.participants_count,
      groupPreference: row.format_preference === "group" ? "group" : "private",
      openToJoiningOthers: row.open_to_join,
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
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

interface OffersSectionProps {
  offers: GuideOfferRow[];
  requestId: string;
  canAccept: boolean;
  guideNames: Record<string, string | null>;
}

function OffersSection({ offers, requestId, canAccept, guideNames }: OffersSectionProps) {
  const pendingOffers = offers.filter((o) => o.status === "pending");

  return (
    <section className="request-offers-section">
      <div className="request-offers-header">
        <h2 className="request-offers-title">Предложения гидов</h2>
        <span className="request-offers-count">{pendingOffers.length}</span>
      </div>

      {pendingOffers.length === 0 ? (
        <div className="glass-card request-offers-empty">
          <p className="request-offers-empty-text">
            Пока нет предложений. Гиды увидят ваш запрос и ответят в ближайшее время.
          </p>
        </div>
      ) : (
        <div className="request-offers-list">
          {pendingOffers.map((offer) => (
            <article key={offer.id} className="glass-card request-offer-card">
              <div className="request-offer-guide">
                <div className="request-offer-avatar">
                  {(guideNames[offer.guide_id] ?? "Г").charAt(0).toUpperCase()}
                </div>
                <div className="request-offer-guide-info">
                  <p className="request-offer-guide-name">
                    {guideNames[offer.guide_id] ?? "Гид"}
                  </p>
                  {offer.expires_at ? (
                    <p className="request-offer-valid-until">
                      До {formatDate(offer.expires_at)}
                    </p>
                  ) : null}
                </div>
                <p className="request-offer-price">{formatRub(offer.price_minor)}</p>
              </div>

              {offer.message ? (
                <p className="request-offer-message">{offer.message}</p>
              ) : null}

              {canAccept ? (
                <div className="request-offer-actions">
                  <AcceptOfferButton
                    offerId={offer.id}
                    requestId={requestId}
                    guideId={offer.guide_id}
                    priceMinor={offer.price_minor}
                  />
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function TravelerRequestDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;

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
    let guideNames: Record<string, string | null> = {};

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
      <div className="request-detail-root">
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
