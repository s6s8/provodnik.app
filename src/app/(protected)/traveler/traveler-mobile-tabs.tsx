"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BookOpen, Calendar, Globe, Heart } from "lucide-react";

import { COPY } from "@/lib/copy";
import { cn } from "@/lib/utils";

const travelerNavItems = [
  {
    href: "/requests",
    label: COPY.nav.openRequests,
    mobileLabel: "Открытые",
    icon: Globe,
  },
  {
    href: "/traveler/requests",
    label: COPY.nav.myRequests,
    mobileLabel: "Запросы",
    icon: BookOpen,
  },
  {
    href: "/traveler/bookings",
    label: COPY.nav.myTrips,
    mobileLabel: COPY.nav.myTrips,
    icon: Calendar,
  },
  {
    href: "/traveler/favorites",
    label: COPY.nav.favorites,
    mobileLabel: COPY.nav.favorites,
    icon: Heart,
  },
  {
    href: "/notifications",
    label: "Уведомления",
    mobileLabel: "Увед.",
    icon: Bell,
  },
] as const;

export function TravelerMobileTabs() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-[1.5rem] border border-glass-border bg-[rgba(249,249,255,0.9)] p-2 shadow-glass backdrop-blur md:hidden"
      aria-label="Traveler workspace mobile"
    >
      {travelerNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-w-0 flex-col items-center gap-1 rounded-[1rem] px-2 py-2 text-center text-[11px] font-medium transition-colors",
              isActive ? "bg-brand-light font-semibold text-brand" : "text-ink-2",
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

