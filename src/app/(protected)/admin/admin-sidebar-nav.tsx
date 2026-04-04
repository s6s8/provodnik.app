"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BarChart3, ClipboardList, Flag, UserCheck } from "lucide-react";

import { cn } from "@/lib/utils";

type AdminNavCounts = {
  guides: number;
  listings: number;
};

const adminNavItems = [
  {
    href: "/admin/dashboard",
    label: "Обзор",
    mobileLabel: "Обзор",
    icon: BarChart3,
    countKey: null,
  },
  {
    href: "/admin/guides",
    label: "Гиды",
    mobileLabel: "Гиды",
    icon: UserCheck,
    countKey: "guides",
  },
  {
    href: "/admin/listings",
    label: "Листинги",
    mobileLabel: "Листинги",
    icon: ClipboardList,
    countKey: "listings",
  },
  {
    href: "/admin/disputes",
    label: "Споры",
    mobileLabel: "Споры",
    icon: Flag,
    countKey: null,
  },
] as const;

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  mobileLabel,
  icon: Icon,
  count,
  active,
}: (typeof adminNavItems)[number] & {
  active: boolean;
  count?: number;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
        active
          ? "bg-brand-light font-semibold text-brand"
          : "text-ink-2 hover:bg-surface-low hover:text-ink",
      )}
    >
      <Icon className="size-[18px] shrink-0" strokeWidth={1.8} />
      <span className="hidden min-w-0 lg:block">{label}</span>
      <span className="min-w-0 lg:hidden">{mobileLabel}</span>
      {typeof count === "number" && count > 0 ? (
        <span className="ml-auto inline-flex min-w-6 items-center justify-center rounded-full bg-brand-light px-2 py-0.5 text-xs font-semibold text-brand">
          {count}
        </span>
      ) : null}
    </Link>
  );
}

export function AdminSidebarNav({
  counts,
}: {
  counts?: AdminNavCounts;
}) {
  const pathname = usePathname() ?? "/admin/dashboard";

  return (
    <nav className="space-y-2" aria-label="Admin workspace">
      {adminNavItems.map((item) => (
        <NavLink
          key={item.href}
          {...item}
          count={item.countKey ? counts?.[item.countKey] : undefined}
          active={isActivePath(pathname, item.href)}
        />
      ))}
    </nav>
  );
}

export function AdminMobileTabs({
  counts,
}: {
  counts?: AdminNavCounts;
}) {
  const pathname = usePathname() ?? "/admin/dashboard";

  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-[1.5rem] border border-glass-border bg-[rgba(249,249,255,0.9)] p-2 shadow-glass backdrop-blur md:hidden"
      aria-label="Admin workspace mobile"
    >
      {adminNavItems.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item.href);
        const count = item.countKey ? counts?.[item.countKey] : undefined;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-w-0 flex-col items-center gap-1 rounded-[1rem] px-2 py-2 text-center text-[11px] font-medium transition-colors",
              active
                ? "bg-brand-light font-semibold text-brand"
                : "text-ink-2",
            )}
          >
            <Icon className="size-4" strokeWidth={1.9} />
            <span className="truncate">{item.mobileLabel}</span>
            {typeof count === "number" && count > 0 ? (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-brand-light px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                {count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
