import Image from "next/image";
import Link from "next/link";

import { ReqCard } from "@/components/shared/req-card";
import { TourCard } from "@/components/shared/tour-card";
import type { DestinationSummary } from "@/data/destinations/types";
import type { OpenRequestRecord } from "@/data/open-requests/types";
import type { ListingRecord } from "@/data/supabase/queries";

function derivePrice(budgetPerPersonRub?: number): string {
  if (!budgetPerPersonRub) return "По договорённости";
  return `${new Intl.NumberFormat("ru-RU").format(budgetPerPersonRub)} ₽ / чел`;
}

interface Props {
  destination: DestinationSummary;
  openRequests?: OpenRequestRecord[];
  listings?: ListingRecord[];
}

export function DestinationDetailScreen({
  destination,
  openRequests = [],
  listings = [],
}: Props) {
  const heroImage =
    destination.imageUrl ||
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1800&q=80";

  const listingCount = destination.listingCount ?? listings.length;
  const guideCount = destination.openRequestCount ?? 0;
  const minPrice = listings.length
    ? Math.min(...listings.map((l) => l.priceRub))
    : null;

  return (
    <main>
      {/* Hero */}
      <section
        className="hero-bleed photo-hero"
        style={{
          minHeight: "520px",
          paddingBottom: "56px",
        }}
      >
        {/* Background image */}
        <Image
          src={heroImage}
          alt={destination.name}
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover", zIndex: 0 }}
        />

        {/* Gradient overlay */}
        <div className="overlay-bottom" aria-hidden />

        {/* Hero content */}
        <div className="container on-dark photo-hero-content">
          <div style={{ maxWidth: "720px" }}>
            {destination.region ? (
              <p
                className="sec-label"
                style={{ color: "rgba(255,255,255,0.72)", marginBottom: "8px" }}
              >
                {destination.region}
              </p>
            ) : null}

            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(3rem, 6vw, 4.5rem)",
                lineHeight: 1.02,
                fontWeight: 600,
              }}
            >
              {destination.name}
            </h1>

            {destination.description ? (
              <p
                style={{
                  marginTop: "16px",
                  maxWidth: "560px",
                  fontSize: "1rem",
                  lineHeight: 1.65,
                  color: "rgba(255,255,255,0.82)",
                }}
              >
                {destination.description}
              </p>
            ) : null}

            {/* Hero pills */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <span className="glass-pill">
                Лучший сезон: весна / лето / осень
              </span>
              <span className="glass-pill">
                Природа · Культура · Гастрономия
              </span>
            </div>

            {/* Hero actions */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <Link href="/requests/new" className="btn-primary">
                Найти гида
              </Link>
              <a
                href="#tours"
                className="btn-ghost"
                style={{
                  borderColor: "rgba(255,255,255,0.32)",
                  color: "#fff",
                }}
              >
                Смотреть маршруты
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section
        style={{
          background: "var(--surface-low)",
          paddingBlock: "32px",
        }}
      >
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "48px",
              textAlign: "center",
            }}
            className="stats-grid"
          >
            <div>
              <strong
                style={{
                  display: "block",
                  fontFamily: "var(--font-ui)",
                  fontSize: "2.25rem",
                  fontWeight: 600,
                  color: "var(--on-surface)",
                }}
              >
                {listingCount}
              </strong>
              <span
                style={{ fontSize: "0.875rem", color: "var(--on-surface-muted)" }}
              >
                готовых туров
              </span>
            </div>

            <div>
              <strong
                style={{
                  display: "block",
                  fontFamily: "var(--font-ui)",
                  fontSize: "2.25rem",
                  fontWeight: 600,
                  color: "var(--on-surface)",
                }}
              >
                {minPrice
                  ? `${new Intl.NumberFormat("ru-RU").format(Math.round(minPrice / 1000))} тыс. ₽`
                  : "—"}
              </strong>
              <span
                style={{ fontSize: "0.875rem", color: "var(--on-surface-muted)" }}
              >
                бюджет от
              </span>
            </div>

            <div>
              <strong
                style={{
                  display: "block",
                  fontFamily: "var(--font-ui)",
                  fontSize: "2.25rem",
                  fontWeight: 600,
                  color: "var(--on-surface)",
                }}
              >
                4.9 ★
              </strong>
              <span
                style={{ fontSize: "0.875rem", color: "var(--on-surface-muted)" }}
              >
                рейтинг гидов
              </span>
            </div>

            <div>
              <strong
                style={{
                  display: "block",
                  fontFamily: "var(--font-ui)",
                  fontSize: "2.25rem",
                  fontWeight: 600,
                  color: "var(--on-surface)",
                }}
              >
                {guideCount > 0 ? `${guideCount} групп` : openRequests.length > 0 ? `${openRequests.length} групп` : "—"}
              </strong>
              <span
                style={{ fontSize: "0.875rem", color: "var(--on-surface-muted)" }}
              >
                формируется сейчас
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Open requests section */}
      {openRequests.length > 0 && (
        <section
          className="section"
          id="groups"
          style={{ paddingBlock: "64px", background: "var(--surface)" }}
        >
          <div className="container">
            <div className="section-hd">
              <div>
                <p className="sec-label">Открытые группы</p>
                <h2 className="sec-title">Путешественники ищут компанию</h2>
              </div>
              <Link
                href="/requests"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--primary)",
                }}
              >
                Все запросы по направлению →
              </Link>
            </div>

            <div className="grid-3 req-grid">
              {openRequests.slice(0, 3).map((request) => {
                const location = request.destinationLabel.split(",")[0].trim();
                const fillPct = Math.round(
                  (request.group.sizeCurrent / request.group.sizeTarget) * 100,
                );
                return (
                  <ReqCard
                    key={request.id}
                    href={`/requests/${request.id}`}
                    location={location}
                    spotsLabel={`${request.group.sizeCurrent} / ${request.group.sizeTarget} мест`}
                    title={request.highlights[0] ?? request.destinationLabel}
                    date={request.dateRangeLabel}
                    desc={request.highlights[1]}
                    fillPct={fillPct}
                    members={request.members}
                    price={derivePrice(request.budgetPerPersonRub)}
                  />
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Tours section */}
      <section
        className="section low"
        id="tours"
        style={{
          paddingBlock: "64px",
          background: "var(--surface-low)",
        }}
      >
        <div className="container">
          <div className="section-hd">
            <div>
              <p className="sec-label">Готовые туры</p>
              <h2 className="sec-title">Авторские маршруты с гидами</h2>
            </div>
            <Link
              href="/listings"
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--primary)",
              }}
            >
              Все туры →
            </Link>
          </div>

          {listings.length > 0 ? (
            <div className="grid-3 tour-grid">
              {listings.slice(0, 3).map((listing) => (
                <TourCard
                  key={listing.id}
                  href={`/listings/${listing.slug}`}
                  imageUrl={listing.imageUrl}
                  title={listing.title}
                  guide={listing.guideName}
                  rating={listing.rating}
                  price={`от ${new Intl.NumberFormat("ru-RU").format(Math.round(listing.priceRub / 1000))} тыс. ₽`}
                />
              ))}
            </div>
          ) : (
            <p
              style={{
                color: "var(--on-surface-muted)",
                fontSize: "1rem",
                padding: "32px 0",
              }}
            >
              Туры по этому направлению скоро появятся.
            </p>
          )}
        </div>
      </section>

    </main>
  );
}
