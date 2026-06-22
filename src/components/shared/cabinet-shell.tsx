"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AvatarStack } from "@/components/ui/avatar-stack";
import { Badge } from "@/components/ui/badge";
import { CompletionBar } from "@/components/ui/completion-bar";
import { cn } from "@/lib/utils";

type CabinetUser = {
  name: string;
  avatarUrl?: string;
  completionPct?: number;
};

type CabinetNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

type CabinetShellProps = {
  user: CabinetUser;
  navItems: CabinetNavItem[];
  children: ReactNode;
  role?: "traveler" | "guide" | "admin";
};

export function CabinetShell({ user, navItems, children }: CabinetShellProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + "/");

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex md:flex-col w-60 sticky top-0 h-screen border-r border-line p-4 gap-1">
        <div className="flex flex-col gap-3 pb-4">
          <div className="flex items-center gap-3">
            <AvatarStack
              users={[{ name: user.name, avatarUrl: user.avatarUrl }]}
              size="compact"
            />
            <span className="font-semibold text-on-surface">{user.name}</span>
          </div>
          {user.completionPct != null ? (
            <CompletionBar completionPct={user.completionPct} />
          ) : null}
        </div>

        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 min-h-[44px] text-sm font-medium",
                active
                  ? "border-l-4 border-primary bg-primary-tint text-primary"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <item.icon className="size-5" />
              {item.label}
              {item.badge != null ? (
                <Badge variant="info">{item.badge}</Badge>
              ) : null}
            </Link>
          );
        })}
      </aside>

      <main className="flex-1 min-w-0">{children}</main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-line bg-card flex justify-around">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center min-h-[44px] flex-1 text-xs",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
