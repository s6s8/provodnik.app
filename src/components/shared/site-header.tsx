"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useUnreadCount } from "@/features/messaging/hooks/use-unread-count";
import { cn } from "@/lib/utils";

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
    <header className="fixed inset-x-0 top-0 z-[100] px-[clamp(20px,4vw,48px)] py-3.5" role="banner">
      <nav
        className="mx-auto grid max-w-page grid-cols-[auto_1fr_auto] items-center gap-6 rounded-full border border-[var(--nav-glass-border)] bg-[var(--nav-glass-bg)] px-6 py-2.5 shadow-glass backdrop-blur-[20px] max-md:grid-cols-[auto_auto] max-md:justify-between"
        aria-label="Основная навигация"
      >
        <Link href="/" className="font-display text-[1.3125rem] font-semibold tracking-[0.02em] text-foreground">
          Provodnik
        </Link>

        <ul className="m-0 flex list-none items-center justify-self-center gap-8 p-0 max-md:hidden" role="list">
          {navLinks.map((link) => {
            const isHashLink = link.href.includes("#");
            const isActive = isHashLink ? pathname === "/" : pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "relative text-sm font-medium text-muted-foreground transition-colors hover:text-primary",
                    isActive && "text-primary",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-self-end gap-2">
          {isAuthenticated ? (
            <Link
              href="/messages"
              className={cn(
                "relative inline-flex items-center gap-2 rounded-full border border-glass-border bg-surface-high/72 px-4 py-2.5 text-sm font-medium text-foreground transition-[background,color,border-color] duration-150 hover:border-primary/24 hover:bg-[color-mix(in_srgb,var(--primary)_8%,var(--surface-high))] hover:text-primary",
                (pathname === "/messages" || pathname.startsWith("/messages/")) && "border-primary/24 text-primary",
              )}
              aria-label="Сообщения"
            >
              <MessageSquare className="size-4" aria-hidden="true" />
              <span>Сообщения</span>
              {unreadCount > 0 ? (
                <span
                  className="inline-flex h-[1.35rem] min-w-[1.35rem] items-center justify-center rounded-full bg-primary px-[0.35rem] text-[0.6875rem] font-bold leading-none text-white"
                  aria-live="polite"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </Link>
          ) : null}
          {!isAuthenticated && (
            <Button variant="outline" asChild>
              <Link href="/auth">Войти</Link>
            </Button>
          )}
          <Button asChild>
            <Link href="/requests/new">Создать запрос</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
