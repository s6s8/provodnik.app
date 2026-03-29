import Link from "next/link";
import { seededDestinations } from "@/data/destinations/index";

// Static featured destination card data (matches HTML SOT)
const FEATURED = {
  slug: "lake-baikal",
  name: "Озеро Байкал",
  blurb:
    "Ледяные бухты зимой, байкальский закат летом и маршруты от Иркутска до Ольхона с проверенными проводниками.",
  imageUrl:
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80",
};

// Additional small cards matching HTML SOT (static — not from seed, to match exact design)
const SMALL_CARDS = [
  {
    name: "Казань",
    tours: "14 туров",
    slug: "kazan",
    imageUrl:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Калининград",
    tours: "20 туров",
    slug: "kaliningrad",
    imageUrl:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Суздаль",
    tours: "16 туров",
    slug: "suzdal",
    imageUrl:
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Мурманск",
    tours: "19 туров",
    slug: "murmansk",
    imageUrl:
      "https://images.unsplash.com/photo-1527489377706-5bf97e608852?auto=format&fit=crop&w=900&q=80",
  },
];


export function HomePageDestinations() {
  // seededDestinations available for future dynamic enrichment
  void seededDestinations;

  return (
    <section className="section" aria-labelledby="dest-title">
      <div className="container">
        {/* Section header */}
        <div className="section-hd">
          <div>
            <p className="sec-label" style={{ marginBottom: "8px" }}>
              Популярные направления
            </p>
            <h2 id="dest-title" className="sec-title">
              Российские маршруты, которые собирают группы быстрее всего
            </h2>
          </div>
          <Link
            href="/destinations"
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--primary)",
              whiteSpace: "nowrap",
            }}
          >
            Все направления →
          </Link>
        </div>

        {/* Destination grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.35fr 1fr 1fr",
            gridTemplateRows: "226px 226px",
            gap: "14px",
          }}
        >
          {/* Featured card — spans 2 rows */}
          <Link
            href={`/destinations/${FEATURED.slug}`}
            style={{
              position: "relative",
              display: "block",
              borderRadius: "28px",
              overflow: "hidden",
              backgroundImage: `url('${FEATURED.imageUrl}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              gridRow: "span 2",
              transition: "transform 0.2s",
            }}
            aria-label={`Посмотреть туры: ${FEATURED.name}`}
          >
            <div className="overlay-top" aria-hidden="true" />
            <div
              style={{
                position: "absolute",
                insetInline: 0,
                bottom: 0,
                padding: "28px",
                color: "#fff",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "2.375rem",
                  fontWeight: 600,
                  lineHeight: 1,
                  marginBottom: "10px",
                }}
              >
                {FEATURED.name}
              </h3>
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "rgba(255,255,255,0.76)",
                  lineHeight: 1.55,
                  marginBottom: "18px",
                  maxWidth: "28ch",
                }}
              >
                {FEATURED.blurb}
              </p>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "8px 20px",
                  borderRadius: "9999px",
                  background: "var(--primary)",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "#fff",
                }}
              >
                Смотреть туры
              </span>
            </div>
          </Link>

          {/* Small cards */}
          {SMALL_CARDS.map((dest) => (
            <Link
              key={dest.slug}
              href={`/destinations/${dest.slug}`}
              style={{
                position: "relative",
                display: "block",
                borderRadius: "28px",
                overflow: "hidden",
                backgroundImage: `url('${dest.imageUrl}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                transition: "transform 0.2s",
              }}
              aria-label={`${dest.name} — ${dest.tours}`}
            >
              <div className="overlay-top" aria-hidden="true" />
              <div
                style={{
                  position: "absolute",
                  insetInline: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  padding: "18px 22px",
                  color: "#fff",
                }}
              >
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", fontWeight: 600 }}>
                  {dest.name}
                </h3>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.75)",
                  }}
                >
                  {dest.tours}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
