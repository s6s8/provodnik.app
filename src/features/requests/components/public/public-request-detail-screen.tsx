import Link from "next/link";

import type { OpenRequestRecord } from "@/data/open-requests/types";
import { joinRequestAction } from "@/app/(site)/requests/[requestId]/actions";

function JoinGroupForm({ requestId }: { requestId: string }) {
  const action = joinRequestAction.bind(null, requestId);
  return (
    <form action={action}>
      <button
        type="submit"
        className="btn-primary"
        style={{ width: "100%", justifyContent: "center" }}
      >
        Присоединиться к группе
      </button>
    </form>
  );
}

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
  currentUserId?: string | null;
  isMember?: boolean;
  showJoinButton?: boolean;
  memberCount?: number;
}

function formatPrice(rub?: number): string {
  if (!rub) return "По договорённости";
  return `${new Intl.NumberFormat("ru-RU").format(rub)} ₽ / чел`;
}

/**
 * Build up to 5 evenly distributed data points between groupSizeMin and
 * groupSizeMax, given a fixed total budget in rubles.
 */
function buildPriceScenarios(
  budgetRub: number,
  groupSizeMin: number,
  groupSizeMax: number,
): Array<{ size: number; pricePerPerson: number }> {
  if (budgetRub <= 0 || groupSizeMin < 1 || groupSizeMax < groupSizeMin) {
    return [];
  }

  const range = groupSizeMax - groupSizeMin;

  if (range === 0) {
    // Single scenario
    return [{ size: groupSizeMin, pricePerPerson: Math.round(budgetRub / groupSizeMin) }];
  }

  // Pick up to 5 evenly-spaced points — always include min and max
  const maxPoints = 5;
  const points: number[] = [];

  if (range + 1 <= maxPoints) {
    // Include every integer
    for (let s = groupSizeMin; s <= groupSizeMax; s++) {
      points.push(s);
    }
  } else {
    // Evenly space maxPoints across [min, max]
    for (let i = 0; i < maxPoints; i++) {
      const fraction = i / (maxPoints - 1);
      const size = Math.round(groupSizeMin + fraction * range);
      if (!points.includes(size)) points.push(size);
    }
  }

  return points.map((size) => ({
    size,
    pricePerPerson: Math.round(budgetRub / size),
  }));
}

function formatRub(rub: number): string {
  return `${new Intl.NumberFormat("ru-RU").format(rub)} ₽`;
}

export function PublicRequestDetailScreen({
  request,
  offers,
  currentUserId,
  isMember = false,
  showJoinButton = false,
  memberCount,
}: Props) {
  const fillPct = Math.min(
    100,
    Math.round((request.group.sizeCurrent / request.group.sizeTarget) * 100),
  );
  const members = request.members ?? [];
  const visibleMembers = members.slice(0, 5);
  const overflowCount = members.length - visibleMembers.length;
  const heroImage =
    request.imageUrl ??
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1800&q=80";

  const heroLabel = request.regionLabel
    ? `Открытая группа · ${request.regionLabel}`
    : "Открытая группа";

  const title = request.highlights[0] ?? request.destinationLabel;
  const description = request.highlights[1] ?? "";
  const aboutText = request.highlights.slice(2).join(" ") || request.highlights.join(" ");

  // Price scenarios: use budgetPerPersonRub * sizeTarget as total budget proxy
  const totalBudget =
    request.budgetPerPersonRub && request.group.sizeTarget
      ? request.budgetPerPersonRub * request.group.sizeTarget
      : 0;

  const priceScenarios = totalBudget > 0
    ? buildPriceScenarios(totalBudget, 1, request.group.sizeTarget)
    : [];

  // Current active size for highlighting
  const activeMemberCount = memberCount ?? request.group.sizeCurrent;

  // Find the highlighted column — closest to current member count
  const highlightedSize = priceScenarios.length > 0
    ? priceScenarios.reduce((prev, curr) =>
        Math.abs(curr.size - activeMemberCount) <
        Math.abs(prev.size - activeMemberCount)
          ? curr
          : prev,
      ).size
    : null;

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
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {/* Avatar stack */}
                    {visibleMembers.length > 0 && (
                      <div className="avatars">
                        {visibleMembers.map((m, i) => (
                          <span
                            key={m.id}
                            className="avatar member-avatar"
                            title={m.displayName}
                            style={{ marginLeft: i === 0 ? 0 : undefined }}
                          >
                            {m.avatarUrl ? (
                              <img
                                src={m.avatarUrl}
                                alt={m.displayName}
                                className="member-avatar-image"
                              />
                            ) : (
                              m.initials
                            )}
                          </span>
                        ))}
                        {overflowCount > 0 && (
                          <span
                            className="avatar member-avatar"
                            title={`Ещё ${overflowCount} участник(а)`}
                            style={{ marginLeft: undefined }}
                          >
                            +{overflowCount}
                          </span>
                        )}
                      </div>
                    )}
                    <span
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--on-surface-muted)",
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

              {/* Price scenarios */}
              {priceScenarios.length > 0 && (
                <div className="price-scenarios" style={{ marginBottom: "24px" }}>
                  <p className="price-scenarios-label">Стоимость на человека</p>
                  <div className="price-scenarios-row">
                    {priceScenarios.map(({ size, pricePerPerson }) => (
                      <div
                        key={size}
                        className={`price-scenarios-cell${highlightedSize === size ? " highlighted" : ""}`}
                      >
                        <div className="price-scenarios-size">{size} чел.</div>
                        <div className="price-scenarios-price">{formatRub(pricePerPerson)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
            <aside className="route-feedback-aside">
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

                {/* Join / Member state */}
                {isMember ? (
                  <span className="member-chip" style={{ display: "flex", justifyContent: "center" }}>
                    Вы участник ✓
                  </span>
                ) : showJoinButton ? (
                  <JoinGroupForm requestId={request.id} />
                ) : !currentUserId ? (
                  <Link
                    href={`/auth/login?next=/requests/${request.id}`}
                    className="btn-primary"
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    Войти и присоединиться
                  </Link>
                ) : null}

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
