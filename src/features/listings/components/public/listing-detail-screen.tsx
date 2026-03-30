import Image from "next/image";
import Link from "next/link";

import type { PublicListing } from "@/data/public-listings/types";

interface Props {
  listing: PublicListing;
  guide?: any;
  reviews?: any[];
}

const fallbackCover =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1800&q=80";

const galleryThumbs = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80&crop=top",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80&crop=center",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80&crop=bottom",
];

const defaultExclusions = ["Авиабилеты", "Личные расходы", "Страховка"];

const fallbackReviews = [
  {
    id: "r1",
    initials: "АМ",
    name: "Анна Миронова",
    rating: 4.9,
    body: "Понравилось, что даже на сложном маршруте было ощущение собранности и контроля. Никакой суеты между точками, всё объяснено заранее.",
  },
  {
    id: "r2",
    initials: "РК",
    name: "Роман Котов",
    rating: 4.9,
    body: "Сильнейший момент — маршрут реально держит контраст и не превращается в хаотичный набор вау-остановок.",
  },
  {
    id: "r3",
    initials: "ТС",
    name: "Татьяна Соколова",
    rating: 4.8,
    body: "Неожиданно комфортный темп. Было понятно, где усилие, а где отдых, и это сделало поездку очень ровной по ощущениям.",
  },
];


function getGuideInitials(guide: any): string {
  if (!guide) return "ГД";
  if (guide.avatarInitials) return guide.avatarInitials;
  const name: string = guide.displayName || guide.name || "";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p: string) => p[0])
    .join("")
    .toUpperCase() || "ГД";
}

export function ListingDetailScreen({ listing, guide, reviews }: Props) {
  const coverImage = listing.coverImageUrl || fallbackCover;
  const priceFormatted = new Intl.NumberFormat("ru-RU").format(listing.priceFromRub);
  const reviewCards = reviews && reviews.length > 0 ? reviews : fallbackReviews;

  const guideInitials = getGuideInitials(guide);
  const guideName = guide?.displayName || guide?.name || "Местный гид";
  const guideRating = guide?.reviewsSummary?.averageRating?.toFixed(1) ?? "4.9";
  const guideSlug = guide?.slug ?? "#";
  const guideRegion = guide?.homeBase ?? listing.region;

  return (
    <main>
      {/* ── Hero ── */}
      <section
        className="hero-bleed photo-hero"
        style={{
          minHeight: "520px",
        }}
      >
        {/* Background image */}
        <Image
          src={coverImage}
          alt={listing.title}
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover" }}
        />

        {/* Gradient overlay */}
        <div className="overlay-bottom" aria-hidden />

        {/* Hero content */}
        <div className="container on-dark photo-hero-content">
          <p
            className="sec-label"
          >
            Авторский тур · {listing.region}
          </p>

          <h1
            className="display-xl"
            style={{
              lineHeight: 1.03,
              fontWeight: 600,
              maxWidth: "18ch",
            }}
          >
            {listing.title}
          </h1>

          {/* Hero pills */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              marginTop: "18px",
            }}
          >
            {[
              `${listing.durationDays} дней`,
              `Группа до ${listing.groupSizeMax} человек`,
              `от ${priceFormatted} ₽`,
            ].map((label) => (
              <span key={label} className="glass-pill">
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main 2-col layout ── */}
      <section style={{ paddingBlock: "64px" }}>
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 2fr) 360px",
              gap: "40px",
              alignItems: "start",
            }}
          >
            {/* ── Left column ── */}
            <div style={{ display: "grid", gap: "32px" }}>
              {/* Gallery */}
              <div style={{ display: "grid", gap: "12px" }}>
                {/* Main image */}
                <div
                  style={{
                    aspectRatio: "16 / 9",
                    borderRadius: "20px",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <Image
                    src={coverImage}
                    alt={listing.title}
                    fill
                    sizes="(max-width: 1023px) 100vw, 66vw"
                    style={{ objectFit: "cover" }}
                  />
                </div>

                {/* Thumbnail row */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "12px",
                  }}
                >
                  {galleryThumbs.map((src, i) => (
                    <div
                      key={i}
                      style={{
                        aspectRatio: "16 / 11",
                        borderRadius: "18px",
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      <Image
                        src={src}
                        alt={`${listing.title} — фото ${i + 2}`}
                        fill
                        sizes="(max-width: 1023px) 33vw, 22vw"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* About route */}
              <section>
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.875rem",
                    lineHeight: 1.08,
                    marginBottom: "14px",
                  }}
                >
                  О маршруте
                </h2>
                {listing.highlights.map((text, i) => (
                  <p
                    key={i}
                    style={{
                      fontSize: "0.9375rem",
                      lineHeight: 1.72,
                      color: "var(--on-surface-muted)",
                      marginTop: i > 0 ? "14px" : undefined,
                    }}
                  >
                    {text}
                  </p>
                ))}
              </section>

              {/* Day-by-day itinerary */}
              <section>
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.875rem",
                    lineHeight: 1.08,
                    marginBottom: "18px",
                  }}
                >
                  Программа по дням
                </h2>
                <ol style={{ display: "grid", gap: "14px" }}>
                  {listing.itinerary.map((item, index) => (
                    <li
                      key={`${item.title}-${index}`}
                      style={{
                        display: "flex",
                        gap: "14px",
                        fontSize: "0.9375rem",
                        lineHeight: 1.72,
                        color: "var(--on-surface-muted)",
                      }}
                    >
                      <strong style={{ color: "var(--on-surface)", flexShrink: 0 }}>
                        День {index + 1}.
                      </strong>
                      <span>
                        <strong style={{ color: "var(--on-surface)" }}>{item.title}.</strong>{" "}
                        {item.description}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>

              {/* Includes / excludes */}
              <section>
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.875rem",
                    lineHeight: 1.08,
                    marginBottom: "18px",
                  }}
                >
                  Что включено
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "12px",
                  }}
                >
                  {/* Inclusions */}
                  <ul style={{ display: "grid", gap: "10px" }}>
                    {listing.inclusions.map((item) => (
                      <li
                        key={item}
                        style={{
                          display: "flex",
                          gap: "8px",
                          fontSize: "0.9375rem",
                          lineHeight: 1.6,
                          color: "var(--on-surface-muted)",
                        }}
                      >
                        <span style={{ color: "var(--primary)", fontWeight: 600, flexShrink: 0 }}>
                          ✓
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>

                  {/* Exclusions */}
                  <ul style={{ display: "grid", gap: "10px" }}>
                    {defaultExclusions.map((item) => (
                      <li
                        key={item}
                        style={{
                          display: "flex",
                          gap: "8px",
                          fontSize: "0.9375rem",
                          lineHeight: 1.6,
                          color: "var(--on-surface-muted)",
                        }}
                      >
                        <span
                          style={{
                            color: "var(--on-surface-muted)",
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          ✗
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            </div>

            {/* ── Right column (sticky) ── */}
            <aside
              style={{
                position: "sticky",
                top: "96px",
                display: "grid",
                gap: "0",
                padding: "28px",
                background: "rgba(249,249,255,0.60)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(194,198,214,0.18)",
                boxShadow: "0 8px 32px rgba(25,28,32,0.06)",
                borderRadius: "28px",
              }}
            >
              {/* Price */}
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "2.4rem",
                  lineHeight: 1,
                  color: "var(--on-surface)",
                }}
              >
                от {priceFormatted} ₽
              </div>
              <p
                style={{
                  marginTop: "8px",
                  color: "var(--on-surface-muted)",
                  fontSize: "0.875rem",
                }}
              >
                на человека
              </p>
              <p
                style={{
                  marginTop: "4px",
                  color: "var(--on-surface-muted)",
                  fontSize: "0.875rem",
                }}
              >
                Группа 4–{listing.groupSizeMax} человек · {listing.durationDays}{" "}
                {listing.durationDays === 1 ? "день" : listing.durationDays < 5 ? "дня" : "дней"}
              </p>

              {/* CTAs */}
              <Link
                href={`/requests/new?listing=${listing.slug}`}
                className="btn-primary"
                style={{ width: "100%", marginTop: "18px" }}
              >
                Создать запрос
              </Link>
              <Link
                href="/requests"
                className="btn-ghost"
                style={{ width: "100%", marginTop: "10px" }}
              >
                Найти группу
              </Link>

              {/* Divider */}
              <div
                style={{
                  height: "1px",
                  background: "rgba(194,198,214,0.30)",
                  margin: "20px 0",
                }}
              />

              {/* Guide mini card */}
              <div
                style={{
                  background: "var(--surface-lowest)",
                  borderRadius: "16px",
                  padding: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {/* Guide avatar */}
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: "var(--surface-low)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--primary)",
                      fontWeight: 600,
                      fontSize: "0.8125rem",
                      flexShrink: 0,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {guide?.avatarImageUrl ? (
                      <Image
                        src={guide.avatarImageUrl}
                        alt={guideName}
                        fill
                        sizes="36px"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      guideInitials
                    )}
                  </div>
                  <div>
                    <strong style={{ display: "block", fontSize: "0.9375rem" }}>
                      {guideName}
                    </strong>
                    <span
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--on-surface-muted)",
                      }}
                    >
                      {guideRegion} · {guideRating} ★
                    </span>
                  </div>
                </div>
                <Link
                  href={`/guides/${guideSlug}`}
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--primary)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Профиль →
                </Link>
              </div>

              <p
                style={{
                  marginTop: "14px",
                  fontSize: "0.8125rem",
                  color: "var(--on-surface-muted)",
                }}
              >
                Оплата после подтверждения состава группы и дат.
              </p>
            </aside>
          </div>
        </div>
      </section>

      {/* ── Reviews section ── */}
      <section style={{ background: "var(--surface-low)", paddingBlock: "48px" }}>
        <div className="container">
          <p className="sec-label">Отзывы</p>
          <h2
            className="sec-title"
            style={{ marginBottom: "28px" }}
          >
            Что говорят о поездке
          </h2>
          <div className="grid-3">
            {reviewCards.map((rev: any) => {
              const reviewInitials =
                rev.initials ||
                (rev.author?.displayName
                  ? rev.author.displayName
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((p: string) => p[0])
                      .join("")
                      .toUpperCase()
                  : "??");
              const reviewName = rev.name || rev.author?.displayName || "Путешественник";
              const reviewRating = rev.rating ?? 5;
              const reviewBody = rev.body || rev.title || "";

              return (
                <article
                  key={rev.id}
                  style={{
                    display: "flex",
                    gap: "14px",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "50%",
                      background: "var(--surface-low)",
                      border: "1px solid rgba(194,198,214,0.30)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--primary)",
                      flexShrink: 0,
                    }}
                  >
                    {reviewInitials}
                  </div>
                  <div>
                    <strong style={{ display: "block", marginBottom: "4px" }}>
                      {reviewName}
                    </strong>
                    <small
                      style={{
                        display: "block",
                        color: "var(--on-surface-muted)",
                        marginBottom: "8px",
                      }}
                    >
                      {reviewRating.toFixed(1)}
                    </small>
                    <p
                      style={{
                        color: "var(--on-surface-muted)",
                        lineHeight: 1.65,
                        fontSize: "0.9375rem",
                      }}
                    >
                      {reviewBody}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
