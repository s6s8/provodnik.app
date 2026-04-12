"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { NotificationRow2 } from "@/lib/supabase/types";

import { NotificationItem } from "./NotificationItem";

/** In-app delivery channel in DB (`notifications.channel` CHECK). */
const IN_APP_NOTIFICATION_CHANNEL = "inbox" as const;

export interface NotificationBellProps {
  userId: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = React.useState<NotificationRow2[]>([]);
  const [open, setOpen] = React.useState(false);

  const markRead = React.useCallback(async (id: string) => {
    if (!hasSupabaseEnv()) return;
    const supabase = createSupabaseBrowserClient();
    await supabase
      .from("notifications")
      .update({ status: "read", read_at: new Date().toISOString() })
      .eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const markAllRead = React.useCallback(async () => {
    if (!hasSupabaseEnv()) return;
    const supabase = createSupabaseBrowserClient();
    await supabase
      .from("notifications")
      .update({ status: "read", read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .neq("status", "read");
    setNotifications([]);
  }, [userId]);

  React.useEffect(() => {
    if (!hasSupabaseEnv()) return;

    let cancelled = false;
    const supabase = createSupabaseBrowserClient();

    async function load() {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .eq("channel", IN_APP_NOTIFICATION_CHANNEL)
        .neq("status", "read")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error || cancelled || !data) return;
      setNotifications(data as NotificationRow2[]);
    }

    void load();

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as NotificationRow2;
          if (row.channel !== IN_APP_NOTIFICATION_CHANNEL || row.status === "read") return;
          setNotifications((prev) => {
            if (prev.some((n) => n.id === row.id)) return prev;
            return [row, ...prev].slice(0, 20);
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  const count = notifications.length;
  const badgeLabel = count > 9 ? "9+" : String(count);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative inline-flex">
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="relative rounded-full border border-glass-border bg-surface-high/72 text-foreground hover:text-primary"
            aria-label="Уведомления"
          >
            <Bell className="size-4" aria-hidden />
          </Button>
        </PopoverTrigger>
        {count > 0 ? (
          <Badge
            variant="destructive"
            className="pointer-events-none absolute -right-1 -top-1 z-10 h-5 min-w-5 border-0 bg-destructive px-1 py-0 text-[0.65rem] font-bold leading-none text-destructive-foreground"
            aria-hidden
          >
            {badgeLabel}
          </Badge>
        ) : null}
      </div>
      <PopoverContent align="end" className="w-[min(100vw-2rem,22rem)] p-0">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <span className="text-sm font-semibold text-foreground">Уведомления</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto shrink-0 px-2 py-1 text-xs"
            disabled={count === 0}
            onClick={() => {
              void markAllRead();
            }}
          >
            Отметить все как прочитанные
          </Button>
        </div>
        <Separator />
        {count === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Нет новых уведомлений</p>
        ) : (
          <ScrollArea className="h-[min(20rem,50vh)]">
            <div className="flex flex-col gap-0.5 p-2">
              {notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onMarkRead={(id) => void markRead(id)} />
              ))}
            </div>
          </ScrollArea>
        )}
        <Separator />
        <div className="px-4 py-3">
          <Button variant="link" className="h-auto p-0 text-sm" asChild>
            <Link href="/profile/notifications">Все уведомления</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
