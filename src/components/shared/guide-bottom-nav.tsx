"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, FileText, Image, MessageSquare, User } from "lucide-react";

import { useUnreadCount } from "@/features/messaging/hooks/use-unread-count";
import { cn } from "@/lib/utils";

const items = [
  { href: "/guide", label: "Запросы", Icon: FileText },
  { href: "/guide/calendar", label: "Календарь", Icon: Calendar },
  { href: "/messages", label: "Сообщения", Icon: MessageSquare, badge: true },
  { href: "/guide/portfolio", label: "Портфолио", Icon: Image },
  { href: "/guide/profile", label: "Профиль", Icon: User },
] as const;

export function GuideBottomNav() {
  const pathname = usePathname();
  const { unreadCount } = useUnreadCount(true);

  return (
    <div
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-background/92 backdrop-blur-xl backdrop-saturate-150 border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="h-16 grid grid-cols-5">
        {items.map((item) => {
          let isActive: boolean;
          if (item.href === "/guide") {
            isActive =
              pathname === "/guide" ||
              pathname.startsWith("/guide/inbox") ||
              pathname.startsWith("/guide/bookings");
          } else {
            isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 min-h-[44px]",
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
                <item.Icon
                  size={22}
                  aria-hidden="true"
                  strokeWidth={isActive ? 2.25 : 1.75}
                />
                {"badge" in item && item.badge && unreadCount > 0 && (
                  <span
                    aria-live="polite"
                    className="absolute -top-1 left-[calc(50%+4px)] min-w-[16px] h-4 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center px-1"
                  >
                    {unreadCount > 99 ? "99+" : String(unreadCount)}
                  </span>
                )}
              </span>

              <span className={cn("text-[11px]", isActive ? "font-bold" : "font-medium")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
