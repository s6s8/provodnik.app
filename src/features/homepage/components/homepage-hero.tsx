import Link from "next/link";

export function HomePageHero() {
  return (
    <section
      aria-label="Главный баннер"
      style={{
        position: "relative",
        minHeight: "55vh",
        maxHeight: "720px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      {/* Background image */}
      <div
        role="img"
        aria-label="Берег озера Байкал, утренний свет"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1800&q=85')",
          backgroundSize: "cover",
          backgroundPosition: "center 40%",
        }}
      />

      {/* Gradient overlay */}
      <div className="overlay-bottom" aria-hidden="true" />

      {/* Content */}
      <div
        className="on-dark"
        style={{
          position: "relative",
          zIndex: 2,
          padding: "96px 20px 48px",
          maxWidth: "860px",
          width: "100%",
        }}
      >
        {/* Kicker */}
        <p
          style={{
            display: "inline-block",
            padding: "5px 16px",
            borderRadius: "9999px",
            background: "rgba(255,255,255,0.14)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.22)",
            fontSize: "0.6875rem",
            fontWeight: 500,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.82)",
            marginBottom: "20px",
          }}
        >
          Маршруты с локальными проводниками
        </p>

        {/* Headline */}
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.25rem, 5vw, 3.625rem)",
            fontWeight: 600,
            lineHeight: 1.06,
            marginBottom: "32px",
          }}
        >
          Путешествуйте по России
          <br />
          с теми, кто знает каждый камень
        </h1>

        {/* Search bar */}
        <form
          action="/destinations"
          method="get"
          role="search"
          aria-label="Поиск направления"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            width: "100%",
            maxWidth: "600px",
            marginInline: "auto",
            padding: "7px 7px 7px 22px",
            borderRadius: "9999px",
            background: "var(--glass-bg)",
            backdropFilter: "var(--glass-blur)",
            WebkitBackdropFilter: "var(--glass-blur)",
            border: "1px solid var(--glass-border)",
            boxShadow: "var(--glass-shadow)",
          }}
        >
          <label className="sr-only" htmlFor="hero-search-input">
            Куда едем?
          </label>
          <input
            id="hero-search-input"
            type="search"
            name="q"
            placeholder="Куда едем? Байкал, Казань, Алтай…"
            autoComplete="off"
            style={{
              flex: 1,
              minWidth: 0,
              background: "transparent",
              border: "none",
              outline: "none",
              fontFamily: "var(--font-ui)",
              fontSize: "0.9375rem",
              color: "var(--on-surface)",
            }}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ flexShrink: 0 }}
          >
            Найти
          </button>
        </form>

        {/* Ghost links */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "24px",
            marginTop: "16px",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/requests/new"
            style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "rgba(255,255,255,0.78)",
              transition: "color 0.15s",
            }}
          >
            Создать запрос →
          </Link>
          <Link
            href="/requests"
            style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "rgba(255,255,255,0.78)",
              transition: "color 0.15s",
            }}
          >
            Найти группу →
          </Link>
        </div>
      </div>
    </section>
  );
}
