"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useUnreadCount } from "@/features/messaging/hooks/use-unread-count";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import type { AppRole, AuthRedirectTarget } from "@/lib/auth/types";
import { COPY } from "@/lib/copy";
import { flags } from "@/lib/flags";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/requests", label: "Запросы" },
  { href: "/destinations", label: "Направления" },
  { href: "/guides", label: "Гиды" },
] as const;

const travelerNavLinks = [
  { href: "/traveler/requests", label: "Мои запросы" },
  { href: "/destinations", label: "Направления" },
] as const;

const guideNavLinks = [
  { href: "/guide", label: "Биржа" },
  { href: "/guide/calendar", label: "Календарь" },
  { href: "/guide/profile", label: "Профиль" },
] as const;

const unauthNavLinks = [
  { href: "/how-it-works", label: COPY.nav.howItWorks },
  { href: "/for-guides", label: COPY.nav.becomeGuide },
] as const;

const roleLabels: Record<AppRole, string> = {
  traveler: "Путешественник",
  guide: "Гид",
  admin: "Оператор",
};

const roleDashboards: Record<AppRole, AuthRedirectTarget> = {
  traveler: "/traveler/requests",
  guide: "/guide",
  admin: "/admin/dashboard",
};

interface SiteHeaderProps {
  isAuthenticated?: boolean;
  role?: AppRole | null;
  email?: string | null;
  canonicalRedirectTo?: AuthRedirectTarget | null;
  userId?: string | null;
}

export function SiteHeader({
  isAuthenticated = false,
  role = null,
  email = null,
  canonicalRedirectTo = null,
  userId = null,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const { unreadCount } = useUnreadCount(isAuthenticated);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  function handleLogout() {
    window.location.href = "/api/auth/signout";
  }

  const dashboardPath = canonicalRedirectTo ?? (role ? roleDashboards[role] : null);
  const avatarInitial = email ? email[0].toUpperCase() : "?";
  const dashboardLabel = role ? roleLabels[role] : "Кабинет";
  const primaryCtaHref = !isAuthenticated ? "/traveler/requests/new" : role === "guide" ? "/requests" : "/requests/new";
  const primaryCtaLabel = !isAuthenticated ? COPY.createRequest : role === "guide" ? "Смотреть запросы" : "Создать запрос";
  const showPrimaryCta = role !== "admin";

  return (
    <header className="fixed inset-x-0 top-0 z-[100] px-[clamp(20px,4vw,48px)] py-3.5" role="banner">
      <nav
        className="mx-auto grid max-w-page grid-cols-[auto_1fr_auto] items-center gap-6 rounded-full border border-nav-glass-border bg-nav-glass-bg px-6 py-2.5 shadow-glass backdrop-blur-[20px] max-md:grid-cols-[auto_auto] max-md:justify-between"
        aria-label="Основная навигация"
      >
        <Link href="/" prefetch={false} className="font-display text-[1.3125rem] font-semibold tracking-[0.02em] text-foreground">
          Provodnik
        </Link>

        <ul className="m-0 flex list-none items-center justify-self-center gap-8 p-0 max-md:hidden" role="list">
          {(isAuthenticated && role === "guide"
            ? guideNavLinks
            : isAuthenticated && role === "traveler"
              ? (pathname.startsWith("/traveler") ? travelerNavLinks : navLinks)
              : isAuthenticated
                ? navLinks
                : unauthNavLinks).map(
            (link) => {
              const isHashLink = link.href.includes("#");
              let isActive: boolean;
              if (link.href === "/guide") {
                isActive = pathname === "/guide" ||
                  pathname.startsWith("/guide/inbox") ||
                  pathname.startsWith("/guide/bookings");
              } else if (isHashLink) {
                isActive = pathname === "/";
              } else {
                isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              }

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
            },
          )}
        </ul>

        <div className="flex items-center justify-self-end gap-2">
          {isAuthenticated && dashboardPath ? (
            <Link
              href={dashboardPath}
              className="bg-surface-high/80 border border-glass-border rounded-full px-3 py-1.5 text-sm font-medium flex items-center gap-2 text-foreground transition-colors hover:text-primary"
              aria-label="Личный кабинет"
            >
              <span className="w-7 h-7 rounded-full bg-primary/20 text-primary text-xs font-semibold flex items-center justify-center">
                {avatarInitial}
              </span>
              {role ? roleLabels[role] : null}
            </Link>
          ) : null}
          {flags.FEATURE_TR_NOTIFICATIONS && isAuthenticated && userId ? (
            <NotificationBell userId={userId} />
          ) : null}
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
          {isAuthenticated ? (
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Выйти
            </Button>
          ) : null}
          {!isAuthenticated && (
            <Button variant="outline" asChild>
              <Link href="/auth">{COPY.nav.signIn}</Link>
            </Button>
          )}
          {role === "admin" || role === "guide" ? null : (
            <Button asChild>
              <Link href={primaryCtaHref}>{primaryCtaLabel}</Link>
            </Button>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="md:hidden"
                aria-label="Открыть меню"
              >
                <Menu className="size-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="bg-background text-foreground border-l border-border"
            >
              <SheetHeader>
                <SheetTitle>Меню</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-2 pb-4" aria-label="Мобильная навигация">
                {(isAuthenticated && role === "guide"
                ? guideNavLinks
                : isAuthenticated && role === "traveler"
                  ? (pathname.startsWith("/traveler") ? travelerNavLinks : navLinks)
                  : isAuthenticated
                    ? navLinks
                    : unauthNavLinks).map((link) => {
                  const isHashLink = link.href.includes("#");
                  let isActive: boolean;
                  if (link.href === "/guide") {
                    isActive = pathname === "/guide" ||
                      pathname.startsWith("/guide/inbox") ||
                      pathname.startsWith("/guide/bookings");
                  } else if (isHashLink) {
                    isActive = pathname === "/";
                  } else {
                    isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                  }

                  return (
                    <SheetClose asChild key={link.href}>
                      <Link
                        href={link.href}
                        className={cn(
                          "w-full rounded-md px-3 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-surface-high hover:text-primary",
                          isActive && "bg-surface-high text-primary",
                        )}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {link.label}
                      </Link>
                    </SheetClose>
                  );
                })}

                <div className="mt-2 h-px bg-border" role="separator" />

                {isAuthenticated ? (
                  <>
                    {dashboardPath ? (
                      <SheetClose asChild>
                        <Link
                          href={dashboardPath}
                          className="w-full rounded-md px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-surface-high hover:text-primary"
                        >
                          {dashboardLabel}
                        </Link>
                      </SheetClose>
                    ) : null}
                    <SheetClose asChild>
                      <Link
                        href="/messages"
                        className="flex w-full items-center justify-between rounded-md px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-surface-high hover:text-primary"
                      >
                        <span className="inline-flex items-center gap-2">
                          <MessageSquare className="size-4" aria-hidden="true" />
                          Сообщения
                        </span>
                        {unreadCount > 0 ? (
                          <span className="inline-flex h-[1.35rem] min-w-[1.35rem] items-center justify-center rounded-full bg-primary px-[0.35rem] text-[0.6875rem] font-bold leading-none text-white">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        ) : null}
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        className="mt-1 w-full justify-start px-3 py-3 text-base font-medium"
                        onClick={handleLogout}
                      >
                        Выйти
                      </Button>
                    </SheetClose>
                  </>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Link
                        href="/auth"
                        className="w-full rounded-md px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-surface-high hover:text-primary"
                      >
                        {COPY.nav.signIn}
                      </Link>
                    </SheetClose>
                    {showPrimaryCta ? (
                      <SheetClose asChild>
                        <Link
                          href={primaryCtaHref}
                          className="mt-1 w-full rounded-md bg-primary px-3 py-3 text-center text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                          {primaryCtaLabel}
                        </Link>
                      </SheetClose>
                    ) : null}
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
