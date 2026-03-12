"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, Circle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getDemoUserIdForRole } from "@/data/notifications/demo";
import {
  countUnreadNotificationsForUser,
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationUnread,
  subscribeToNotificationsChanged,
} from "@/data/notifications/local-store";
import type { NotificationRecord, NotificationSeverity } from "@/data/notifications/types";
import type { DemoRole } from "@/lib/demo-session";
import { readDemoSessionFromDocument } from "@/lib/demo-session";
import { cn } from "@/lib/utils";

type FeedFilter = "all" | "unread";

export function NotificationCenterScreen() {
  const [role, setRole] = React.useState<DemoRole | null>(null);
  const [filter, setFilter] = React.useState<FeedFilter>("all");
  const [notifications, setNotifications] = React.useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);

  const userId = React.useMemo(() => (role ? getDemoUserIdForRole(role) : null), [role]);

  const refresh = React.useCallback(() => {
    if (!userId) return;
    const next = listNotificationsForUser(userId);
    setNotifications(next);
    setUnreadCount(countUnreadNotificationsForUser(userId));
  }, [userId]);

  React.useEffect(() => {
    setRole(readDemoSessionFromDocument()?.role ?? "traveler");
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  React.useEffect(() => {
    return subscribeToNotificationsChanged(() => refresh());
  }, [refresh]);

  const visible = React.useMemo(() => {
    if (filter === "unread") return notifications.filter((item) => item.readAt === null);
    return notifications;
  }, [filter, notifications]);

  const grouped = React.useMemo(() => groupNotifications(visible), [visible]);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Badge variant="outline">Notification center</Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Notifications
          </h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            A unified feed for request, booking, and moderation events. Read state is
            stored locally for the demo session role; no backend required.
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
            All
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
            Unread
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
          disabled={!userId || unreadCount === 0}
          onClick={() => {
            if (!userId) return;
            markAllNotificationsRead(userId);
          }}
        >
          Mark all read
          <Check className="size-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {visible.length === 0 ? (
          <Card className="border-border/70 bg-card/90">
            <CardHeader className="space-y-1">
              <CardTitle>No notifications</CardTitle>
              <p className="text-sm text-muted-foreground">
                Seeded events will appear here as marketplace activity grows.
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
                      userId={userId}
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
  userId,
}: {
  notification: NotificationRecord;
  userId: string | null;
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
                  Unread
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Read</span>
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
              disabled={!userId}
              onClick={() => {
                if (!userId) return;
                if (isUnread) markNotificationRead(userId, notification.id);
                else markNotificationUnread(userId, notification.id);
              }}
            >
              {isUnread ? "Mark read" : "Mark unread"}
            </Button>
          </div>
        </div>

        {notification.href ? (
          <div className="flex items-center justify-between gap-3">
            <Separator className="flex-1" />
            <Button asChild size="sm" variant="ghost">
              <Link href={notification.href}>
                Open destination
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
  if (severity === "success") return "Success";
  if (severity === "warning") return "Attention";
  return "Info";
}

function labelKind(kind: NotificationRecord["kind"]) {
  switch (kind) {
    case "request_update":
      return "Request";
    case "new_offer":
      return "Offer";
    case "booking_update":
      return "Booking";
    case "message":
      return "Message";
    case "review_reminder":
      return "Review";
    case "system":
      return "System";
    default:
      return "Update";
  }
}

function formatTimestamp(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-GB", {
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
    { key: "today", label: "Today", items: [] },
    { key: "yesterday", label: "Yesterday", items: [] },
    { key: "earlier", label: "Earlier", items: [] },
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

