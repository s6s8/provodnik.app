"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { adminPrimaryNav, isNavActive, type NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type AdminNavCounts = {
  guides: number;
  listings: number;
};

const countKeyByHref: Record<string, keyof AdminNavCounts> = {
  "/admin/guides": "guides",
  // #43/#47: pending-listing count now rides the Moderation entry (the listings
  // queue merged into the Moderation center).
  "/admin/moderation": "listings",
};

function NavLink({
  item,
  count,
  active,
}: {
  item: NavItem;
  active: boolean;
  count?: number;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
        active
          ? "bg-brand-light font-semibold text-brand"
          : "text-ink-2 hover:bg-surface-low hover:text-ink",
      )}
    >
      <Icon className="size-[18px] shrink-0" strokeWidth={1.8} />
      <span className="hidden min-w-0 lg:block">{item.label}</span>
      <span className="min-w-0 lg:hidden">{item.shortLabel ?? item.label}</span>
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
    <nav className="flex flex-col gap-2" aria-label="Admin workspace">
      {adminPrimaryNav.map((item: NavItem) => {
        const countKey = countKeyByHref[item.href];
        return (
          <NavLink
            key={item.href}
            item={item}
            count={countKey ? counts?.[countKey] : undefined}
            active={isNavActive(pathname, item)}
          />
        );
      })}
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
      className="fixed inset-x-4 bottom-4 z-40 grid grid-cols-4 gap-1 rounded-card border border-glass-border bg-nav-glass-bg p-1.5 shadow-glass backdrop-blur sm:grid-cols-8 md:hidden"
      aria-label="Admin workspace mobile"
    >
      {adminPrimaryNav.map((item: NavItem) => {
        const Icon = item.icon;
        const active = isNavActive(pathname, item);
        const countKey = countKeyByHref[item.href];
        const count = countKey ? counts?.[countKey] : undefined;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-w-0 flex-col items-center gap-1 rounded-lg px-2 py-2 text-center text-xs font-medium transition-colors",
              active
                ? "bg-brand-light font-semibold text-brand"
                : "text-ink-2",
            )}
          >
            <Icon className="size-4" strokeWidth={1.9} />
            <span className="truncate">{item.shortLabel ?? item.label}</span>
            {typeof count === "number" && count > 0 ? (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-brand-light px-1.5 py-0.5 text-xs font-semibold text-brand">
                {count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
