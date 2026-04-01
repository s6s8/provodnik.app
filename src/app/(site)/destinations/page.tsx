import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import { getDestinations, type DestinationRecord } from "@/data/supabase/queries";

export function generateMetadata(): Metadata {
  return {
    title: "Направления",
    description: "Откройте лучшие направления для путешествий по России",
  };
}

export default async function DestinationsPage() {
  let destinations: DestinationRecord[] = [];

  const result = await getDestinations(null as any);
  if (result.data) destinations = result.data;

  const [featured, ...rest] = destinations;

  return (
    <>
      <section className="dest-page">
        <div className="container">
          <p className="sec-label">Направления</p>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.25rem, 5vw, 3.625rem)",
              fontWeight: 600,
              lineHeight: 1.05,
              color: "var(--on-surface)",
              marginTop: "8px",
              marginBottom: "12px",
            }}
          >
            Куда поедем?
          </h1>
          <p
            style={{
              fontSize: "1rem",
              lineHeight: 1.65,
              color: "var(--on-surface-muted)",
              maxWidth: "46rem",
            }}
          >
            Города и регионы России с проверенными маршрутами и локальными гидами.
          </p>

          {destinations.length === 0 && (
            <p style={{ color: "var(--on-surface-muted)", marginTop: "32px" }}>Пока нет доступных направлений.</p>
          )}

          {destinations.length > 0 && (
            <div className="dest-grid">
              {featured && (
                <Link href={`/destinations/${featured.slug}`} className="dest-card dest-card-featured">
                  <Image
                    src={featured.heroImageUrl || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&q=80"}
                    alt={featured.name}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="(max-width: 767px) 100vw, (max-width: 1023px) 100vw, 560px"
                  />
                  <div className="dest-card-content">
                    {featured.listingCount ? (
                      <span className="dest-card-pill">{featured.listingCount} туров</span>
                    ) : null}
                    <p className="dest-card-name">{featured.name}</p>
                    <p className="dest-card-region">{featured.region}</p>
                  </div>
                </Link>
              )}

              {rest.slice(0, 4).map((dest) => (
                <Link key={dest.slug} href={`/destinations/${dest.slug}`} className="dest-card">
                  <Image
                    src={dest.heroImageUrl || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80"}
                    alt={dest.name}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 320px"
                  />
                  <div className="dest-card-content">
                    <p className="dest-card-name small">{dest.name}</p>
                    <p className="dest-card-region">{dest.region}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
