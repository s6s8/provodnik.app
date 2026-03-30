"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/destinations", label: "Направления" },
  { href: "/guides", label: "Гиды" },
  { href: "/#hiw", label: "Как это работает" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header" role="banner">
      <nav className="main-nav" aria-label="Основная навигация">
        <Link href="/" className="nav-logo">
          Provodnik
        </Link>

        <ul className="nav-links" role="list">
          {navLinks.map((link) => {
            const isHashLink = link.href.includes("#");
            const isActive = isHashLink ? pathname === "/" : pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={isActive ? "active" : undefined}
                  aria-current={isActive ? "page" : undefined}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="nav-ctas">
          <Link href="/auth" className="btn-ghost nav-login">
            Войти
          </Link>
          <Link href="/requests/new" className="btn-primary nav-request-cta">
            Создать запрос
          </Link>
        </div>
      </nav>
    </header>
  );
}
