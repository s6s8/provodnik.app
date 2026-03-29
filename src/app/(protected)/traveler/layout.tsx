import type { ReactNode } from "react";

import Link from "next/link";
import { Bell, BookOpen, Calendar, Heart } from "lucide-react";

import { readAuthContextFromServer } from "@/lib/auth/server-auth";
import { cn } from "@/lib/utils";

const travelerNavItems = [
  {
    href: "/traveler/requests",
    label: "Мои запросы",
    mobileLabel: "Запросы",
    icon: BookOpen,
  },
  {
    href: "/traveler/bookings",
    label: "Бронирования",
    mobileLabel: "Брони",
    icon: Calendar,
  },
  {
    href: "/traveler/favorites",
    label: "Избранное",
    mobileLabel: "Избранное",
    icon: Heart,
  },
  {
    href: "/notifications",
    label: "Уведомления",
    mobileLabel: "Увед.",
    icon: Bell,
  },
] as const;

export default async function TravelerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const auth = await readAuthContextFromServer();
  const initials = getInitials(auth.email);

  return (
    <div className="pb-24 md:pb-0">
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <WorkspaceSidebar initials={initials} email={auth.email} />
        <main className="min-w-0">{children}</main>
      </div>
      <MobileWorkspaceTabs />
    </div>
  );
}

function WorkspaceSidebar({
  initials,
  email,
}: {
  initials: string;
  email: string | null;
}) {
  return (
    <aside className="hidden lg:block">
      <div className="glass-card sticky top-28 space-y-5 rounded-[1.75rem] p-6">
        <div className="space-y-3">
          <div className="flex size-14 items-center justify-center rounded-full bg-[var(--brand-light)] font-display text-2xl font-semibold text-[var(--brand)]">
            {initials}
          </div>
          <div className="space-y-1">
            <p className="font-medium text-[var(--ink)]">Кабинет путешественника</p>
            <p className="text-sm text-[var(--ink-3)]">{email ?? "demo@provodnik.app"}</p>
          </div>
        </div>
        <div className="h-px bg-[rgba(15,25,35,0.08)]" />
        <nav className="space-y-2" aria-label="Traveler workspace">
          {travelerNavItems.map((item, index) => {
            const Icon = item.icon;
            const isDefaultActive = index === 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isDefaultActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                  isDefaultActive
                    ? "bg-[var(--brand-light)] font-semibold text-[var(--brand)]"
                    : "text-[var(--ink-2)] hover:bg-[var(--surface-low)] hover:text-[var(--ink)]",
                )}
              >
                <Icon className="size-[18px]" strokeWidth={1.8} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

function MobileWorkspaceTabs() {
  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-[1.5rem] border border-[var(--glass-border)] bg-[rgba(249,249,255,0.9)] p-2 shadow-[var(--glass-shadow)] backdrop-blur md:hidden"
      aria-label="Traveler workspace mobile"
    >
      {travelerNavItems.map((item, index) => {
        const Icon = item.icon;
        const isDefaultActive = index === 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isDefaultActive ? "page" : undefined}
            className={cn(
              "flex min-w-0 flex-col items-center gap-1 rounded-[1rem] px-2 py-2 text-center text-[11px] font-medium transition-colors",
              isDefaultActive
                ? "bg-[var(--brand-light)] font-semibold text-[var(--brand)]"
                : "text-[var(--ink-2)]",
            )}
          >
            <Icon className="size-4" strokeWidth={1.9} />
            <span className="truncate">{item.mobileLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function getInitials(email: string | null) {
  if (!email) return "П";
  const [localPart] = email.split("@");
  const normalized = localPart.replace(/[^a-zа-яё0-9]+/gi, " ").trim();
  const parts = normalized.split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "П";
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
