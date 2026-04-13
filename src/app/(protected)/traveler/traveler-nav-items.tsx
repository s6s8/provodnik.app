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

export function TravelerNavItems() {
  const pathname = usePathname();

  return (
    <>
      {travelerNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
              isActive
                ? "bg-brand-light font-semibold text-brand"
                : "text-ink-2 hover:bg-surface-low hover:text-ink",
            )}
          >
            <Icon className="size-[18px]" strokeWidth={1.8} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </>
  );
}

