"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, Circle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { NotificationRecord, NotificationSeverity } from "@/data/notifications/types";
import type { DemoRole } from "@/lib/demo-session";
import { readDemoSessionFromDocument } from "@/lib/demo-session";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type FeedFilter = "all" | "unread";

function mapNotificationRow(row: Record<string, unknown>): NotificationRecord {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    kind: (row.kind as NotificationRecord["kind"]) ?? "system",
    severity: "info" as NotificationSeverity,
    createdAt: row.created_at as string,
    readAt: row.is_read ? (row.created_at as string) : null,
    title: row.title as string,
    body: (row.body as string) ?? "",
    href: (row.href as string) ?? undefined,
    metadata: undefined,
  };
}

export function NotificationCenterScreen() {
  const [role, setRole] = React.useState<DemoRole | null>(null);
  const [filter, setFilter] = React.useState<FeedFilter>("all");
  const [notifications, setNotifications] = React.useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    setRole(readDemoSessionFromDocument()?.role ?? "traveler");
  }, []);

  React.useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("notifications")
          .select("id, user_id, kind, title, body, href, is_read, created_at")
          .order("created_at", { ascending: false });

        if (error || !data || ignore) return;
        const mapped = data.map(mapNotificationRow);
        setNotifications(mapped);
        setUnreadCount(mapped.filter((n) => n.readAt === null).length);
      } catch {
        // Supabase unavailable
      }
    }

    void load();
    return () => { ignore = true; };
  }, [role]);

  const markRead = React.useCallback(
    async (notificationId: string) => {
      try {
        const supabase = createSupabaseBrowserClient();
        await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId);
      } catch {
        // ignore
      }
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    },
    [],
  );

  const markUnread = React.useCallback(
    async (notificationId: string) => {
      try {
        const supabase = createSupabaseBrowserClient();
        await supabase.from("notifications").update({ is_read: false }).eq("id", notificationId);
      } catch {
        // ignore
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, readAt: null } : n)),
      );
      setUnreadCount((prev) => prev + 1);
    },
    [],
  );

  const markAllRead = React.useCallback(async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
    } catch {
      // ignore
    }
    setNotifications((prev) =>
      prev.map((n) => (n.readAt === null ? { ...n, readAt: new Date().toISOString() } : n)),
    );
    setUnreadCount(0);
  }, []);

  const visible = React.useMemo(() => {
    if (filter === "unread") return notifications.filter((item) => item.readAt === null);
    return notifications;
  }, [filter, notifications]);

  const grouped = React.useMemo(() => groupNotifications(visible), [visible]);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Badge variant="outline">Центр уведомлений</Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Уведомления
          </h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            Единая лента по заявкам, бронированиям и событиям модерации.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={filter === "all" ? "secondary" : "outline"}
            onClick={() => setFilter("all")}
          >
            Все
            <Badge variant="outline" className="ml-2 bg-background">
              {notifications.length}
            </Badge>
          </Button>
          <Button
            type="button"
            size="sm"
            variant={filter === "unread" ? "secondary" : "outline"}
            onClick={() => setFilter("unread")}
          >
            Непрочитанные
            <Badge
              variant={unreadCount === 0 ? "outline" : "secondary"}
              className="ml-2 bg-background"
            >
              {unreadCount}
            </Badge>
          </Button>
        </div>

        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={unreadCount === 0}
          onClick={() => void markAllRead()}
        >
          Прочитать всё
          <Check className="size-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {visible.length === 0 ? (
          <Card className="border-border/70 bg-card/90">
            <CardHeader className="space-y-1">
              <CardTitle>Пока пусто</CardTitle>
              <p className="text-sm text-muted-foreground">
                Новые события появятся здесь, когда в кабинете будут заявки,
                бронирования и сообщения.
              </p>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => (
              <section key={group.key} className="space-y-3" aria-label={group.label}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">{group.label}</p>
                  <Separator className="flex-1" />
                </div>
                <div className="grid gap-3">
                  {group.items.map((item) => (
                    <NotificationCard
                      key={item.id}
                      notification={item}
                      onMarkRead={markRead}
                      onMarkUnread={markUnread}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationCard({
  notification,
  onMarkRead,
  onMarkUnread,
}: {
  notification: NotificationRecord;
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
}) {
  const isUnread = notification.readAt === null;
  const severityVariant = getSeverityBadgeVariant(notification.severity);

  return (
    <Card
      className={cn(
        "border-border/70 bg-card/90",
        isUnread && "border-primary/40 bg-background",
      )}
    >
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={severityVariant}>{labelSeverity(notification.severity)}</Badge>
              <Badge variant="outline" className="bg-background">
                {labelKind(notification.kind)}
              </Badge>
              {isUnread ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
                  <Circle className="size-2 fill-primary text-primary" />
                  Новое
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Прочитано</span>
              )}
            </div>
            <CardTitle className={cn("text-base", isUnread && "font-semibold")}>
              {notification.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{notification.body}</p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <p className="text-xs text-muted-foreground">{formatTimestamp(notification.createdAt)}</p>
            <Button
              type="button"
              size="sm"
              variant={isUnread ? "secondary" : "outline"}
              onClick={() => {
                if (isUnread) onMarkRead(notification.id);
                else onMarkUnread(notification.id);
              }}
            >
              {isUnread ? "Отметить прочитанным" : "Вернуть в непрочитанные"}
            </Button>
          </div>
        </div>

        {notification.href ? (
          <div className="flex items-center justify-between gap-3">
            <Separator className="flex-1" />
            <Button asChild size="sm" variant="ghost">
              <Link href={notification.href}>
                Открыть событие
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="pt-0" />
    </Card>
  );
}

function getSeverityBadgeVariant(severity: NotificationSeverity) {
  if (severity === "success") return "default";
  if (severity === "warning") return "destructive";
  return "secondary";
}

function labelSeverity(severity: NotificationSeverity) {
  if (severity === "success") return "Готово";
  if (severity === "warning") return "Важно";
  return "Инфо";
}

function labelKind(kind: NotificationRecord["kind"]) {
  switch (kind) {
    case "request_update":
      return "Заявка";
    case "new_offer":
      return "Предложение";
    case "booking_update":
      return "Бронирование";
    case "message":
      return "Сообщение";
    case "review_reminder":
      return "Отзыв";
    case "system":
      return "Система";
    default:
      return "Обновление";
  }
}

function formatTimestamp(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupNotifications(items: NotificationRecord[]) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

  const groups: { key: string; label: string; items: NotificationRecord[] }[] = [
    { key: "today", label: "Сегодня", items: [] },
    { key: "yesterday", label: "Вчера", items: [] },
    { key: "earlier", label: "Раньше", items: [] },
  ];

  for (const item of items) {
    const time = Date.parse(item.createdAt);
    if (Number.isNaN(time)) {
      groups[2].items.push(item);
      continue;
    }
    if (time >= startOfToday) groups[0].items.push(item);
    else if (time >= startOfYesterday) groups[1].items.push(item);
    else groups[2].items.push(item);
  }

  return groups.filter((group) => group.items.length > 0);
}
