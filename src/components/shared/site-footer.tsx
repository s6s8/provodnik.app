import Link from "next/link";

const VK_ICON = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14C20.67 22 22 20.67 22 15.07V8.93C22 3.33 20.67 2 15.07 2zm3.08 13.87h-1.62c-.61 0-.8-.49-1.9-1.6-.95-.93-1.37-.93-1.6-.93-.33 0-.42.09-.42.56v1.46c0 .4-.13.64-1.18.64-1.74 0-3.67-1.06-5.02-3.03C4.7 10.3 4.27 8.45 4.27 8.06c0-.23.09-.45.56-.45h1.62c.42 0 .58.19.74.64.82 2.36 2.19 4.43 2.75 4.43.21 0 .3-.1.3-.64V9.81c-.07-1.15-.67-1.24-.67-1.65 0-.19.15-.39.4-.39h2.55c.35 0 .47.19.47.6v3.23c0 .35.15.47.26.47.21 0 .38-.12.77-.51 1.19-1.33 2.04-3.38 2.04-3.38.11-.23.3-.45.73-.45h1.62c.49 0 .6.25.49.6-.21 1-.2.97-1.55 2.94-.23.37-.32.54 0 .93.23.28.98.93 1.48 1.49.92 1.04 1.62 1.91 1.81 2.51.2.59-.1.89-.7.89z" />
  </svg>
);

const TG_ICON = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.68 7.92c-.12.56-.46.7-.93.43l-2.6-1.91-1.25 1.21c-.14.14-.26.26-.53.26l.19-2.66 4.84-4.37c.21-.19-.05-.29-.32-.1L7.97 14.37l-2.55-.8c-.55-.17-.56-.55.12-.82l9.95-3.84c.46-.17.86.11.15.89z" />
  </svg>
);

export function SiteFooter() {
  return (
    <footer className="site-footer" role="contentinfo">
        <div className="footer-inner">
          {/* 3-column grid */}
          <div className="footer-grid">
            {/* Col 1: О проекте */}
            <nav aria-label="О проекте">
              <p className="footer-col-label">О проекте</p>
              <ul className="footer-links">
                {[
                  { href: "#", label: "О нас" },
                  { href: "/guides", label: "Для гидов" },
                  { href: "#", label: "Блог" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Col 2: Поддержка */}
            <nav aria-label="Поддержка">
              <p className="footer-col-label">Поддержка</p>
              <ul className="footer-links">
                {[
                  { href: "#", label: "FAQ" },
                  { href: "#", label: "Помощь" },
                  { href: "#", label: "Связаться с нами" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Col 3: Правила + Мы в сети */}
            <div>
              <nav aria-label="Правила">
                <p className="footer-col-label">Правила</p>
                <ul className="footer-links">
                  {[
                    { href: "#", label: "Условия использования" },
                    { href: "#", label: "Конфиденциальность" },
                    { href: "#", label: "Cookies" },
                  ].map((link) => (
                    <li key={link.label}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <div style={{ marginTop: 24 }}>
                <p className="footer-col-label">Мы в сети</p>
                <div className="footer-social">
                  {[
                    { href: "#", label: "ВКонтакте", icon: VK_ICON },
                    { href: "#", label: "Telegram", icon: TG_ICON },
                  ].map((social) => (
                    <Link
                      key={social.label}
                      href={social.href}
                      aria-label={social.label}
                      className="footer-social-btn"
                    >
                      {social.icon}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="footer-bottom">
            <p className="footer-copy">
              © 2026 Provodnik. Все права защищены.
            </p>
            <div className="footer-legal">
              {[
                { href: "#", label: "Условия" },
                { href: "#", label: "Конфиденциальность" },
              ].map((link) => (
                <Link key={link.label} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
  );
}
