"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare } from "lucide-react";

import { useUnreadCount } from "@/features/messaging/hooks/use-unread-count";

const navLinks = [
  { href: "/destinations", label: "Направления" },
  { href: "/guides", label: "Гиды" },
  { href: "/#hiw", label: "Как это работает" },
] as const;

interface SiteHeaderProps {
  isAuthenticated?: boolean;
}

export function SiteHeader({ isAuthenticated = false }: SiteHeaderProps) {
  const pathname = usePathname();
  const { unreadCount } = useUnreadCount(isAuthenticated);

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
          {isAuthenticated ? (
            <Link
              href="/messages"
              className={pathname === "/messages" || pathname.startsWith("/messages/") ? "nav-message-link active" : "nav-message-link"}
              aria-label="Сообщения"
            >
              <MessageSquare className="nav-message-icon" aria-hidden="true" />
              <span>Сообщения</span>
              {unreadCount > 0 ? (
                <span className="nav-message-badge" aria-live="polite">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </Link>
          ) : null}
          {!isAuthenticated && (
            <Link href="/auth" className="btn-ghost nav-login">
              Войти
            </Link>
          )}
          <Link href="/requests/new" className="btn-primary nav-request-cta">
            Создать запрос
          </Link>
        </div>
      </nav>
    </header>
  );
}
