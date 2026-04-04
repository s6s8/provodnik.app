import Image from "next/image";
import Link from "next/link";

import { TourCard } from "@/components/shared/tour-card";
import { ReqCard } from "@/components/shared/req-card";
import type { PublicGuideProfile } from "@/data/public-guides/types";

interface Props {
  guide: PublicGuideProfile;
  listings?: any[];
  offers?: any[];
  reviews?: any[];
}

function getInitials(name: string, fallback?: string): string {
  if (fallback) return fallback;
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

const fallbackListings = [
  {
    href: "/listings/olkhon-3-days",
    imageUrl:
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&q=80",
    title: "Ольхон 3 дня",
    guide: "Андрей Воронов",
    rating: 4.9,
    price: "от 45 тыс. ₽",
  },
  {
    href: "/listings/winter-baikal",
    imageUrl:
      "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?auto=format&fit=crop&w=1600&q=80",
    title: "Зимний Байкал",
    guide: "Андрей Воронов",
    rating: 4.8,
    price: "от 38 тыс. ₽",
  },
  {
    href: "/listings/irkutsk-listvyanka",
    imageUrl:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80",
    title: "Иркутск + Листвянка",
    guide: "Андрей Воронов",
    rating: 4.7,
    price: "от 22 тыс. ₽",
  },
];

const fallbackOffers = [
  {
    href: "/requests/olkhon-ice",
    location: "Байкал",
    spotsLabel: "оффер отправлен",
    title: "Ольхон и лёд Малого Моря",
    date: "24–26 июля",
    desc: "Группа почти собрана, гид дал оффер на камерный темп и городское завершение в Иркутске.",
    fillPct: 67,
    price: "48 тыс. ₽ / группа",
  },
  {
    href: "/requests/altai-chuysky",
    location: "Алтай",
    spotsLabel: "оффер отправлен",
    title: "Чуйский тракт и перевалы",
    date: "2–5 августа",
    desc: "Гид предложил схему с длинными остановками и одним резервным блоком под погоду.",
    fillPct: 60,
    price: "52 тыс. ₽ / группа",
  },
  {
    href: "/requests/karelia-ladoga",
    location: "Карелия",
    spotsLabel: "оффер отправлен",
    title: "Ладога, скалы, баня",
    date: "15–18 июля",
    desc: "Гид уже обозначил бюджет и формат лодки.",
    fillPct: 50,
    price: "41 тыс. ₽ / группа",
  },
];

const fallbackReviews = [
  {
    id: "r1",
    initials: "АК",
    name: "Анна Климова",
    date: "Февраль 2026",
    rating: 4.9,
    body: "Гид не перегружает маршрут списком обязательных точек. В поездке осталось место и для природы, и для тишины, и для нормального ритма группы.",
  },
  {
    id: "r2",
    initials: "МС",
    name: "Михаил Серов",
    date: "Март 2026",
    rating: 4.9,
    body: "Сильнее всего запомнилось, как он перестроил день под ветер и при этом не сломал маршрут. Это редкий уровень спокойствия и контроля.",
  },
  {
    id: "r3",
    initials: "ТП",
    name: "Татьяна Пестова",
    date: "Июль 2025",
    rating: 4.9,
    body: "Было ощущение не группового тура, а хорошо собранной поездки для друзей. Всё прозрачно по деньгам и очень аккуратно по темпу.",
  },
];

export function GuideProfileScreen({ guide, listings, offers, reviews }: Props) {
  const initials = getInitials(guide.displayName, guide.avatarInitials);
  const rating = guide.reviewsSummary.averageRating;
  const totalReviews = guide.reviewsSummary.totalReviews;

  const tourCards =
    listings && listings.length > 0
      ? listings.map((l: any) => ({
          href: `/listings/${l.slug ?? l.id ?? ""}`,
          imageUrl: l.coverImageUrl ?? l.imageUrl ?? "",
          title: l.title ?? "",
          guide: guide.displayName,
          rating: l.rating ?? guide.reviewsSummary.averageRating,
          price: l.priceFromRub
            ? `от ${new Intl.NumberFormat("ru-RU").format(Math.round(l.priceFromRub / 1000))} тыс. ₽`
            : l.price ?? "",
        }))
      : fallbackListings;
  const offerCards = (offers && offers.length > 0 ? offers : fallbackOffers) as typeof fallbackOffers;
  const reviewCards = (reviews && reviews.length > 0 ? reviews : fallbackReviews).map((rev: any) => ({
    id: rev.id,
    authorName: rev.name || rev.author?.displayName || "Путешественник",
    rating: rev.rating ?? 5,
    title: rev.title || "Отзыв",
    body: rev.body || "",
    createdAt: rev.createdAt || new Date().toISOString(),
    bookingLabel: rev.date || undefined,
  }));

  return (
    <main>
      {/* ── Hero: portrait left + credentials right ── */}
      <section
        style={{
          background: "var(--surface)",
          padding: "110px 0 64px",
        }}
      >
        <div className="container">
          <div className="guide-hero-grid">
            {/* Left: Portrait photo */}
            <div
              className="guide-hero-portrait"
              style={{
                position: "relative",
                borderRadius: "28px",
                overflow: "hidden",
                aspectRatio: "3 / 4",
                background: "var(--surface-low)",
              }}
            >
              {guide.avatarImageUrl ? (
                <Image
                  src={guide.avatarImageUrl.replace("w=400&h=400", "w=600&h=800")}
                  alt={guide.displayName}
                  fill
                  sizes="(max-width: 767px) 100vw, 380px"
                  style={{ objectFit: "cover", objectPosition: "top" }}
                  priority
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-display)",
                    fontSize: "4rem",
                    color: "var(--primary)",
                  }}
                >
                  {initials}
                </div>
              )}
            </div>

            {/* Right: Credentials */}
            <div style={{ paddingTop: "8px" }}>
              {/* Kicker */}
              <p className="sec-label">{guide.homeBase}</p>

              {/* Name */}
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
                  lineHeight: 1.05,
                  color: "var(--on-surface)",
                  marginTop: "8px",
                  marginBottom: "16px",
                }}
              >
                {guide.displayName}
              </h1>

              {/* Headline */}
              <p
                style={{
                  fontSize: "1.0625rem",
                  color: "var(--on-surface-muted)",
                  lineHeight: 1.65,
                  maxWidth: "36rem",
                  marginBottom: "24px",
                }}
              >
                {guide.headline}
              </p>

              {/* Trust badges */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginBottom: "24px",
                }}
              >
                {guide.trustMarkers.identityVerified && (
                  <span className="pill-primary">
                    ✓ Верифицирован
                  </span>
                )}
                <span className="pill">
                  {rating.toFixed(1)} / 5 · {totalReviews} отзывов
                </span>
                <span className="pill">
                  {guide.yearsExperience} лет опыта
                </span>
              </div>

              {/* Stats row */}
              <div
                className="stats-row"
                style={{
                  marginBottom: "28px",
                  paddingBottom: "28px",
                  borderBottom: "1px solid var(--outline-variant)",
                  width: "fit-content",
                }}
              >
                <div>
                  <strong
                    style={{
                      display: "block",
                      fontFamily: "var(--font-display)",
                      fontSize: "2rem",
                      lineHeight: 1,
                      color: "var(--on-surface)",
                    }}
                  >
                    {rating.toFixed(1)}
                  </strong>
                  <span style={{ fontSize: "0.8125rem", color: "var(--on-surface-muted)" }}>
                    рейтинг
                  </span>
                </div>
                <div>
                  <strong
                    style={{
                      display: "block",
                      fontFamily: "var(--font-display)",
                      fontSize: "2rem",
                      lineHeight: 1,
                      color: "var(--on-surface)",
                    }}
                  >
                    {totalReviews}
                  </strong>
                  <span style={{ fontSize: "0.8125rem", color: "var(--on-surface-muted)" }}>
                    поездок
                  </span>
                </div>
                <div>
                  <strong
                    style={{
                      display: "block",
                      fontFamily: "var(--font-display)",
                      fontSize: "2rem",
                      lineHeight: 1,
                      color: "var(--on-surface)",
                    }}
                  >
                    {guide.yearsExperience}
                  </strong>
                  <span style={{ fontSize: "0.8125rem", color: "var(--on-surface-muted)" }}>
                    лет опыта
                  </span>
                </div>
              </div>

              {/* Bio */}
              <p
                style={{
                  color: "var(--on-surface-muted)",
                  lineHeight: 1.7,
                  marginBottom: "24px",
                  maxWidth: "38rem",
                }}
              >
                {guide.bio}
              </p>

              {/* Language + specialty pills */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginBottom: "32px",
                }}
              >
                {guide.languages.map((lang) => (
                  <span key={lang} className="pill">
                    {lang}
                  </span>
                ))}
                {guide.specialties.map((s) => (
                  <span key={s} className="pill">
                    {s}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <Link href="/requests/new" className="btn-primary">
                Связаться с гидом
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tours section ── */}
      <section
        className="section"
        style={{ background: "var(--surface-low)" }}
      >
        <div className="container">
          <p className="sec-label">Туры гида</p>
          <h2
            className="sec-title"
            style={{ marginBottom: "28px" }}
          >
            Авторские маршруты {guide.displayName.split(" ")[0]}а
          </h2>
          <div className="grid-3">
            {tourCards.map((t) => (
              <TourCard
                key={t.href}
                href={t.href}
                imageUrl={t.imageUrl}
                title={t.title}
                guide={t.guide}
                rating={t.rating}
                price={t.price}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Active offers section ── */}
      <section className="section">
        <div className="container">
          <p className="sec-label">Активные офферы</p>
          <h2
            className="sec-title"
            style={{ marginBottom: "28px" }}
          >
            Открытые запросы, где гид предложил цену
          </h2>
          <div className="grid-3">
            {offerCards.map((o) => (
              <ReqCard
                key={o.href}
                href={o.href}
                location={o.location}
                spotsLabel={o.spotsLabel}
                title={o.title}
                date={o.date}
                desc={o.desc}
                fillPct={o.fillPct}
                price={o.price}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Reviews section ── */}
      <section
        className="section"
        style={{ background: "var(--surface-low)" }}
      >
        <div className="container">
          <p className="sec-label">Отзывы</p>
          <h2
            className="sec-title"
            style={{ marginBottom: "28px" }}
          >
            Что говорят путешественники
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
              const reviewDate = rev.date || (rev.createdAt ? new Date(rev.createdAt).toLocaleDateString("ru-RU", { month: "long", year: "numeric" }) : "");
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
                  {/* Avatar bubble */}
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
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
                      {reviewDate}
                      {reviewDate ? " · " : ""}
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
