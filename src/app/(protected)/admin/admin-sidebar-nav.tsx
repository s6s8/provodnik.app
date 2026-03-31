"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ClipboardList, Flag, UserCheck } from "lucide-react";

import { cn } from "@/lib/utils";

const adminNavItems = [
  {
    href: "/admin/dashboard",
    label: "Проверка гидов",
    mobileLabel: "Гиды",
    icon: UserCheck,
  },
  {
    href: "/admin/listings",
    label: "Модерация",
    mobileLabel: "Объявл.",
    icon: ClipboardList,
  },
  {
    href: "/admin/disputes",
    label: "Споры и возвраты",
    mobileLabel: "Споры",
    icon: Flag,
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
  active,
}: (typeof adminNavItems)[number] & { active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
        active
          ? "bg-[var(--brand-light)] font-semibold text-[var(--brand)]"
          : "text-[var(--ink-2)] hover:bg-[var(--surface-low)] hover:text-[var(--ink)]",
      )}
    >
      <Icon className="size-[18px] shrink-0" strokeWidth={1.8} />
      <span className="hidden min-w-0 lg:block">{label}</span>
      <span className="min-w-0 lg:hidden">{mobileLabel}</span>
    </Link>
  );
}

export function AdminSidebarNav() {
  const pathname = usePathname() ?? "/admin/dashboard";

  return (
    <nav className="space-y-2" aria-label="Admin workspace">
      {adminNavItems.map((item) => (
        <NavLink
          key={item.href}
          {...item}
          active={isActivePath(pathname, item.href)}
        />
      ))}
    </nav>
  );
}

export function AdminMobileTabs() {
  const pathname = usePathname() ?? "/admin/dashboard";

  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-3 rounded-[1.5rem] border border-[var(--glass-border)] bg-[rgba(249,249,255,0.9)] p-2 shadow-[var(--glass-shadow)] backdrop-blur md:hidden"
      aria-label="Admin workspace mobile"
    >
      {adminNavItems.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-w-0 flex-col items-center gap-1 rounded-[1rem] px-2 py-2 text-center text-[11px] font-medium transition-colors",
              active
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
