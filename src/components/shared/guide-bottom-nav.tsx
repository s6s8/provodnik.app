"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isNavActive, mobileBottomNavByRole, type NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function GuideBottomNav() {
  const pathname = usePathname();

  return (
    <div
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-background/92 backdrop-blur-xl backdrop-saturate-150 border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="h-16 grid grid-cols-4">
        {mobileBottomNavByRole.guide.map((item: NavItem) => {
          const isActive = isNavActive(pathname, item);
          const label = item.shortLabel ?? item.label;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 min-h-11 px-1",
                isActive ? "text-primary font-bold" : "text-muted-foreground",
              )}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-primary rounded-b-[3px]"
                />
              )}

              <span className="relative">
                <Icon
                  size={22}
                  aria-hidden="true"
                  strokeWidth={isActive ? 2.25 : 1.75}
                />
              </span>

              <span
                className={cn(
                  "max-w-full truncate text-xs",
                  isActive ? "font-bold" : "font-medium",
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
