import Image from "next/image";
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
            <p className="sec-label">Популярные направления</p>
            <h2 id="dest-title" className="sec-title">
              Российские маршруты, которые собирают группы быстрее всего
            </h2>
          </div>
          <Link href="/destinations" className="destinations-link">
            Все направления →
          </Link>
        </div>

        <div className="homepage-destinations-grid">
          {featured ? (
            <Link
              href={`/destinations/${featured.slug}`}
              className="homepage-destinations-card homepage-destinations-card-featured"
            >
              <Image
                src={featured.heroImageUrl}
                alt=""
                fill
                sizes="(min-width: 1024px) 39vw, (min-width: 768px) 50vw, 100vw"
                className="homepage-destinations-media"
              />
              <div className="overlay-top" aria-hidden="true" />
              <div className="homepage-destinations-featured-content">
                <h3 className="homepage-destinations-featured-title">{featured.name}</h3>
                <p className="homepage-destinations-featured-description">{featured.description}</p>
                <span className="homepage-destinations-featured-cta">Смотреть туры</span>
              </div>
            </Link>
          ) : null}

          {rest.slice(0, 4).map((dest) => (
            <Link
              key={dest.slug}
              href={`/destinations/${dest.slug}`}
              className="homepage-destinations-card"
            >
              <Image
                src={dest.heroImageUrl}
                alt=""
                fill
                sizes="(min-width: 1024px) 29vw, (min-width: 768px) 50vw, 100vw"
                className="homepage-destinations-media"
              />
              <div className="overlay-top" aria-hidden="true" />
              <div className="homepage-destinations-card-content">
                <h3 className="card-title-sm">{dest.name}</h3>
                <span className="homepage-destinations-meta">{dest.listingCount} туров</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
