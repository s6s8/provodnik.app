"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useUnreadCount } from "@/features/messaging/hooks/use-unread-count";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { ProfileAvatar } from "@/components/profile-avatar";
import type { AppRole, AuthRedirectTarget } from "@/lib/auth/types";
import { COPY } from "@/lib/copy";
import { resolveDisplayName } from "@/lib/profile/resolve-display-name";
import { cn } from "@/lib/utils";
import { UserAccountDrawer } from "@/components/shared/user-account-drawer";

const navLinks = [
  { href: "/requests", label: "Запросы" },
  { href: "/destinations", label: "Направления" },
  { href: "/guides", label: "Гиды" },
] as const;

const travelerNavLinks = [
  { href: "/traveler/requests", label: "Мои запросы" },
  { href: "/requests", label: "Открытые группы" },
  { href: "/listings", label: "Готовые экскурсии" },
  { href: "/destinations", label: "Направления" },
] as const;

const guideNavLinks = [
  { href: "/guide", label: "Запросы" },
  { href: "/guide/listings", label: "Мои объявления" },
] as const;

const publicNavLinks = [
  { href: "/requests", label: "Открытые группы" },
  { href: "/listings", label: "Готовые экскурсии" },
  { href: "/guides", label: "Гиды" },
  { href: "/how-it-works", label: "Как это работает" },
] as const;


const roleLabels: Record<AppRole, string> = {
  traveler: "Путешественник",
  guide: resolveDisplayName("guide", {}),
  admin: "Администратор",
};

interface SiteHeaderProps {
  isAuthenticated?: boolean;
  role?: AppRole | null;
  email?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  canonicalRedirectTo?: AuthRedirectTarget | null;
  userId?: string | null;
  notificationsEnabled?: boolean;
}

export function SiteHeader({
  isAuthenticated = false,
  role = null,
  email = null,
  fullName = null,
  avatarUrl = null,
  userId = null,
  notificationsEnabled = false,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const showAccountIdentity = isAuthenticated;
  const { unreadCount } = useUnreadCount(isAuthenticated);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const logoutFormRef = React.useRef<HTMLFormElement>(null);

  const profileHref = role === "guide" ? "/guide/profile" : "/profile/personal";
  const primaryCtaHref = role === "guide" ? "/requests" : "/form";
  const primaryCtaLabel = role === "guide" ? "Смотреть запросы" : "Создать запрос";
  const accountLabel = fullName?.trim().split(/\s+/)[0] || (role ? roleLabels[role] : "Аккаунт");
  const messagesLabel =
    unreadCount > 0 ? `Сообщения, непрочитанных: ${unreadCount}` : "Сообщения";

  return (
    <>
    <header className="fixed inset-x-0 top-0 z-[100] px-[clamp(20px,4vw,48px)] py-3.5" role="banner">
      <nav
        className="mx-auto grid max-w-page grid-cols-[1fr_auto_1fr] items-center gap-6 rounded-full border border-nav-glass-border bg-nav-glass-bg px-6 py-2.5 shadow-glass backdrop-blur-[20px] max-md:grid-cols-[auto_auto] max-md:justify-between"
        aria-label="Основная навигация"
      >
        <Link href="/" prefetch={false} className="inline-flex min-h-11 items-center font-display text-[1.3125rem] font-semibold tracking-[0.02em] text-foreground">
          Provodnik
        </Link>

        <ul className="m-0 flex list-none items-center justify-self-center gap-8 p-0 max-md:hidden" role="list">
          {(isAuthenticated && role === "guide"
            ? guideNavLinks
            : isAuthenticated && role === "traveler"
              ? travelerNavLinks
              : isAuthenticated
                ? navLinks
                : publicNavLinks).map(
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
          {showAccountIdentity ? (
            <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`Меню аккаунта: ${accountLabel}`}
                  className="max-md:hidden rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-opacity hover:opacity-80"
                >
                  <ProfileAvatar
                    profile={{ full_name: fullName, avatar_url: avatarUrl }}
                    size={36}
                    className="shrink-0"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{accountLabel}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={profileHref}>Мой профиль</Link>
                </DropdownMenuItem>
                {role === "guide" && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/guide/portfolio">Портфолио</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/guide/calendar">Календарь</Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/help">Помощь</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(event) => {
                    // Radix closes (and unmounts) the menu on select, which
                    // cancels a native form submit inside it. Keep the menu open
                    // and submit the sibling form imperatively so logout fires.
                    event.preventDefault();
                    logoutFormRef.current?.requestSubmit();
                  }}
                >
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <form
              ref={logoutFormRef}
              action="/api/auth/signout"
              method="post"
              className="hidden"
              aria-hidden="true"
            />
            </>
          ) : null}
          {notificationsEnabled && isAuthenticated && userId ? (
            <NotificationBell userId={userId} />
          ) : null}
          {isAuthenticated ? (
            <Link
              href="/messages"
              className={cn(
                "relative inline-flex items-center justify-center size-10 rounded-full border border-glass-border bg-surface-high/72 text-foreground transition-[background,color,border-color] duration-150 hover:border-primary/24 hover:text-primary",
                (pathname === "/messages" || pathname.startsWith("/messages/")) && "border-primary/24 text-primary",
              )}
              aria-label={messagesLabel}
            >
              <MessageSquare className="size-5" aria-hidden="true" />
              {unreadCount > 0 ? (
                <span
                  className="absolute -top-1 -right-1 inline-flex h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full bg-destructive px-[0.25rem] text-[0.6rem] font-bold leading-none text-destructive-foreground"
                  aria-live="polite"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </Link>
          ) : null}
          {!isAuthenticated && (
            <div className="max-md:hidden flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/become-a-guide">{COPY.nav.becomeGuide}</Link>
              </Button>
              <Button asChild>
                <Link href="/auth">{COPY.nav.signIn}</Link>
              </Button>
            </div>
          )}
          {isAuthenticated && role !== "admin" && role !== "guide" && (
            <Button asChild className="max-md:hidden">
              <Link href={primaryCtaHref}>{primaryCtaLabel}</Link>
            </Button>
          )}

          {showAccountIdentity && (
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Личное меню"
              aria-haspopup="dialog"
              className="md:hidden w-11 h-11 rounded-full bg-primary/15 text-primary border-2 border-primary font-bold text-sm flex items-center justify-center"
            >
              <ProfileAvatar
                profile={{ full_name: fullName, avatar_url: avatarUrl }}
                size={44}
                className="shrink-0"
              />
            </button>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="md:hidden min-h-11 min-w-11"
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
                <SheetDescription className="sr-only">
                  Навигация по разделам Provodnik.
                </SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-2 pb-4" aria-label="Мобильная навигация">
                {(isAuthenticated && role === "guide"
                ? guideNavLinks
                : isAuthenticated && role === "traveler"
                  ? travelerNavLinks
                  : isAuthenticated
                    ? navLinks
                    : publicNavLinks).map((link) => {
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

                {!isAuthenticated ? (
                  <>
                    <div className="mt-2 h-px bg-border" role="separator" />

                    <SheetClose asChild>
                      <Link
                        href="/become-a-guide"
                        className="w-full rounded-md px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-surface-high hover:text-primary"
                      >
                        {COPY.nav.becomeGuide}
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href="/auth"
                        className="mt-1 w-full rounded-md bg-primary px-3 py-3 text-center text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        {COPY.nav.signIn}
                      </Link>
                    </SheetClose>
                  </>
                ) : null}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
    <UserAccountDrawer
      open={drawerOpen}
      onOpenChange={setDrawerOpen}
      email={email}
      fullName={fullName}
      avatarUrl={avatarUrl}
      role={role ?? null}
    />
    </>
  );
}
