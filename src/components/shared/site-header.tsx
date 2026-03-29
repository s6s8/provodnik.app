"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Главная" },
  { href: "/destinations", label: "Направления" },
  { href: "/requests", label: "Запросы" },
  { href: "/guides", label: "Гиды" },
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
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href)) ? "page" : undefined}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="nav-ctas">
          <Link href="/auth" className="btn-ghost-nav">
            Войти
          </Link>
          <Link href="/requests/new" className="btn-primary-nav">
            Создать запрос
          </Link>
        </div>
      </nav>
    </header>
  );
}
