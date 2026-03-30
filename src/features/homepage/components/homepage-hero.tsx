import Link from "next/link";

export function HomePageHero() {
  return (
    <section aria-label="Главный баннер" className="hero-bleed home-hero">
      <div
        role="img"
        aria-label="Горный пейзаж России в мягком свете"
        className="home-hero-media"
      />
      <div className="overlay-bottom" aria-hidden="true" />

      <div className="container home-hero-content on-dark photo-hero-content">
        <p className="home-hero-kicker">Маршруты с локальными проводниками</p>

        <h1 className="home-hero-title">
          Путешествуйте по России
          <br />
          с теми, кто знает каждый камень
        </h1>

        <div className="home-hero-actions">
          <Link href="/requests/new" className="btn-primary home-hero-primary">
            Создать запрос
          </Link>
          <Link href="/requests" className="home-hero-link">
            Найти группу →
          </Link>
        </div>
      </div>
    </section>
  );
}
