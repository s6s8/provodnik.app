import Link from "next/link";

import type { OpenRequestRecord } from "@/data/open-requests/types";

type GuideOffer = {
  id: string;
  guideName: string;
  guideInitials: string;
  rating?: string;
  priceTotalRub: number;
  href?: string;
};


interface Props {
  request: OpenRequestRecord;
  offers?: GuideOffer[] | null;
}

function formatPrice(rub?: number): string {
  if (!rub) return "По договорённости";
  return `${new Intl.NumberFormat("ru-RU").format(rub)} ₽ / чел`;
}

export function PublicRequestDetailScreen({ request, offers }: Props) {
  const fillPct = Math.min(
    100,
    Math.round((request.group.sizeCurrent / request.group.sizeTarget) * 100),
  );
  const members = request.members ?? [];
  const heroImage =
    request.imageUrl ??
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1800&q=80";

  const heroLabel = request.regionLabel
    ? `Открытая группа · ${request.regionLabel}`
    : "Открытая группа";

  const title = request.highlights[0] ?? request.destinationLabel;
  const description = request.highlights[1] ?? "";
  const aboutText = request.highlights.slice(2).join(" ") || request.highlights.join(" ");

  return (
    <main>
      {/* Hero */}
      <section
        className="hero-bleed photo-hero"
        style={{
          minHeight: "480px",
        }}
      >
        {/* Background image */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url('${heroImage}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden="true"
        />
        {/* Gradient overlay */}
        <div className="overlay-top" aria-hidden="true" />
        <div className="container on-dark photo-hero-content">
          <div style={{ maxWidth: "760px" }}>
            <p
              className="sec-label"
              style={{ color: "rgba(255,255,255,0.75)", marginBottom: "12px" }}
            >
              {heroLabel}
            </p>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.4rem, 5vw, 3rem)",
                lineHeight: 1.04,
                fontWeight: 600,
              }}
            >
              {title}
            </h1>
            {description && (
              <p style={{ marginTop: "16px", fontSize: "1rem", lineHeight: 1.65, color: "rgba(255,255,255,0.82)" }}>
                {description}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section
        style={{
          background: "var(--surface)",
          padding: "56px 0 80px",
        }}
      >
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
              gap: "32px",
              alignItems: "start",
            }}
          >
            {/* Left column */}
            <div>
              {/* Status card */}
              <article
                style={{
                  background: "var(--surface-lowest)",
                  borderRadius: "var(--card-radius)",
                  boxShadow: "var(--card-shadow)",
                  padding: "28px",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    marginBottom: "18px",
                  }}
                >
                  <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--on-surface)" }}>
                    Участники группы
                  </h2>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div style={{ display: "flex" }}>
                      {members.map((m, i) => (
                        <span
                          key={m.id}
                          className="avatar"
                          title={m.displayName}
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            background: "var(--surface-low)",
                            border: "2px solid var(--surface-lowest)",
                            marginLeft: i === 0 ? 0 : "-6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.5625rem",
                            fontWeight: 600,
                            color: "var(--on-surface)",
                            overflow: "hidden",
                          }}
                        >
                          {m.avatarUrl ? (
                            <img src={m.avatarUrl} alt={m.displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            m.initials
                          )}
                        </span>
                      ))}
                    </div>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--on-surface-muted)",
                        marginLeft: "12px",
                      }}
                    >
                      {request.group.sizeCurrent} из {request.group.sizeTarget} мест занято
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div
                  style={{
                    height: "4px",
                    background: "var(--surface-low)",
                    borderRadius: "9999px",
                    overflow: "hidden",
                    marginBottom: "22px",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      background: "var(--primary)",
                      borderRadius: "9999px",
                      width: `${fillPct}%`,
                    }}
                  />
                </div>

                {/* Meta grid */}
                <dl
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "18px 20px",
                  }}
                >
                  <div>
                    <dt
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "var(--on-surface-muted)",
                        marginBottom: "6px",
                      }}
                    >
                      Даты
                    </dt>
                    <dd style={{ fontSize: "0.9375rem", fontWeight: 500, color: "var(--on-surface)" }}>
                      {request.dateRangeLabel}
                    </dd>
                  </div>
                  <div>
                    <dt
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "var(--on-surface-muted)",
                        marginBottom: "6px",
                      }}
                    >
                      Направление
                    </dt>
                    <dd style={{ fontSize: "0.9375rem", fontWeight: 500, color: "var(--on-surface)" }}>
                      {request.destinationLabel.split(",")[0].trim()}
                    </dd>
                  </div>
                  <div>
                    <dt
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "var(--on-surface-muted)",
                        marginBottom: "6px",
                      }}
                    >
                      Бюджет
                    </dt>
                    <dd style={{ fontSize: "0.9375rem", fontWeight: 500, color: "var(--on-surface)" }}>
                      {formatPrice(request.budgetPerPersonRub)}
                    </dd>
                  </div>
                  <div>
                    <dt
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "var(--on-surface-muted)",
                        marginBottom: "6px",
                      }}
                    >
                      Формат
                    </dt>
                    <dd style={{ fontSize: "0.9375rem", fontWeight: 500, color: "var(--on-surface)" }}>
                      {request.group.openToMoreMembers ? "Открыта запись" : "Группа закрыта"}
                    </dd>
                  </div>
                </dl>
              </article>

              {/* О маршруте */}
              <section style={{ paddingTop: "24px" }}>
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.75rem",
                    lineHeight: 1.1,
                    marginBottom: "14px",
                    color: "var(--on-surface)",
                  }}
                >
                  О маршруте
                </h2>
                <p
                  style={{
                    color: "var(--on-surface-muted)",
                    fontSize: "0.9375rem",
                    lineHeight: 1.72,
                  }}
                >
                  {aboutText}
                </p>
              </section>

              {/* Что запланировано */}
              {request.highlights.length > 1 && (
                <section style={{ paddingTop: "32px" }}>
                  <h2
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.75rem",
                      lineHeight: 1.1,
                      marginBottom: "14px",
                      color: "var(--on-surface)",
                    }}
                  >
                    Что запланировано
                  </h2>
                  <ul style={{ display: "grid", gap: "12px" }}>
                    {request.highlights.map((item, i) => (
                      <li
                        key={i}
                        style={{
                          color: "var(--on-surface-muted)",
                          fontSize: "0.9375rem",
                          lineHeight: 1.72,
                        }}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            {/* Right column — sticky offer card */}
            <aside>
              <div
                style={{
                  position: "sticky",
                  top: "96px",
                  padding: "28px",
                  background: "var(--surface-lowest)",
                  boxShadow: "var(--card-shadow)",
                  borderRadius: "var(--card-radius)",
                }}
              >
                {/* Price */}
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "2.5rem",
                    lineHeight: 1,
                    marginBottom: "8px",
                    color: "var(--on-surface)",
                  }}
                >
                  {formatPrice(request.budgetPerPersonRub)}
                </div>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--on-surface-muted)",
                    marginBottom: "20px",
                  }}
                >
                  на человека при заполнении группы
                </p>

                <Link
                  href={`/requests/${request.id}/join`}
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Присоединиться к группе
                </Link>

                {/* Divider */}
                <div
                  style={{
                    height: "1px",
                    background: "color-mix(in srgb, var(--outline-variant) 30%, transparent)",
                    margin: "22px 0",
                  }}
                />

                {/* Guide offers */}
                <p
                  className="sec-label"
                  style={{ color: "var(--on-surface-muted)", marginBottom: "12px" }}
                >
                  Офферы гидов
                </p>
                <div style={{ display: "grid", gap: "12px" }}>
                  {offers && offers.length > 0 ? (
                    offers.map((offer) => (
                      <article
                        key={offer.id}
                        style={{
                          background: "var(--surface-lowest)",
                          borderRadius: "var(--card-radius)",
                          boxShadow: "var(--card-shadow)",
                          padding: "16px",
                          display: "grid",
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "12px",
                          }}
                        >
                          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                            <span
                              style={{
                                width: "38px",
                                height: "38px",
                                borderRadius: "50%",
                                background: "var(--surface-low)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                color: "var(--primary)",
                                flexShrink: 0,
                              }}
                            >
                              {offer.guideInitials}
                            </span>
                            <div>
                              <strong style={{ display: "block", fontSize: "0.9375rem", color: "var(--on-surface)" }}>
                                {offer.guideName}
                              </strong>
                              {offer.rating && (
                                <span style={{ fontSize: "0.8125rem", color: "var(--on-surface-muted)" }}>
                                  {offer.rating} ★
                                </span>
                              )}
                            </div>
                          </div>
                          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--on-surface)" }}>
                            {new Intl.NumberFormat("ru-RU").format(offer.priceTotalRub)} ₽ / группа
                          </span>
                        </div>
                        <Link
                          href={offer.href ?? "#"}
                          className="btn-ghost"
                          style={{ justifyContent: "center" }}
                        >
                          Посмотреть
                        </Link>
                      </article>
                    ))
                  ) : (
                    <p style={{ fontSize: "0.9375rem", color: "var(--on-surface-muted)", lineHeight: 1.65 }}>
                      Пока нет предложений. Запрос уже виден гидам в системе.
                    </p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
