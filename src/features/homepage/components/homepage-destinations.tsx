import Link from "next/link";
import type { DestinationRecord } from "@/data/supabase/queries";

interface Props {
  destinations: DestinationRecord[];
}

export function HomePageDestinations({ destinations }: Props) {
  if (destinations.length === 0) return null;

  const [featured, ...rest] = destinations;

  return (
    <section className="section" aria-labelledby="dest-title">
      <div className="container">
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.35fr 1fr 1fr",
            gridTemplateRows: "226px 226px",
            gap: "14px",
          }}
        >
          {featured && (
            <Link
              href={`/destinations/${featured.slug}`}
              style={{
                position: "relative",
                display: "block",
                borderRadius: "28px",
                overflow: "hidden",
                backgroundImage: `url('${featured.heroImageUrl}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                gridRow: "span 2",
                transition: "transform 0.2s",
              }}
              aria-label={`Посмотреть туры: ${featured.name}`}
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
                  {featured.name}
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
                  {featured.description}
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
          )}

          {rest.slice(0, 4).map((dest) => (
            <Link
              key={dest.slug}
              href={`/destinations/${dest.slug}`}
              style={{
                position: "relative",
                display: "block",
                borderRadius: "28px",
                overflow: "hidden",
                backgroundImage: `url('${dest.heroImageUrl}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                transition: "transform 0.2s",
              }}
              aria-label={`${dest.name} — ${dest.listingCount} туров`}
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
                  {dest.listingCount} туров
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
