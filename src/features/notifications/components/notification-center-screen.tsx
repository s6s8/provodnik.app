"use client";

import * as React from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { AlertCircle, ArrowRight, Bell, Check, Circle } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ListRow } from "@/components/shared/list-row";
import { ListRowSkeleton } from "@/components/shared/loading-skeletons";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { NotificationRecord, NotificationSeverity } from "@/data/notifications/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { isUnreadNotification } from "./NotificationBell";

type FeedFilter = "all" | "unread";

// Selected option = primary fill; overrides the muted default of the toggle variant.
const TOGGLE_ACTIVE_CLASS =
  "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground";

function mapNotificationRow(row: Record<string, unknown>): NotificationRecord {
  const kind = (row.kind as NotificationRecord["kind"]) ?? "admin_alert";
  const readAt = (row.read_at as string | null) ?? null;

  return {
    id: row.id as string,
    userId: row.user_id as string,
    kind,
    severity: getSeverityForKind(kind),
    createdAt: row.created_at as string,
    readAt: isUnreadNotification({
      status: (row.status as string | null) ?? null,
      read_at: readAt,
    }) ? null : readAt,
    title: row.title as string,
    body: (row.body as string) ?? "",
    href: (row.href as string) ?? undefined,
    metadata: undefined,
  };
}

export function NotificationCenterScreen() {
  const [filter, setFilter] = React.useState<FeedFilter>("all");
  const [notifications, setNotifications] = React.useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [loadError, setLoadError] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    let ignore = false;

    async function load() {
      setLoadError(false);
      setLoading(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || ignore) return;

        setUserId(user.id);
        const { data, error } = await supabase
          .from("notifications")
          .select("id, user_id, kind, title, body, href, status, read_at, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error || !data) {
          if (!ignore) setLoadError(true);
          return;
        }
        if (ignore) return;
        const mapped = data.map(mapNotificationRow);
        setNotifications(mapped);
        setUnreadCount(mapped.filter((n) => n.readAt === null).length);
      } catch {
        if (!ignore) setLoadError(true);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void load();
    return () => { ignore = true; };
  }, [reloadKey]);

  const markRead = React.useCallback(
    async (notificationId: string) => {
      if (!userId) return;

      const readAt = new Date().toISOString();
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("notifications")
          .update({ is_read: true, status: "read", read_at: readAt })
          .eq("id", notificationId)
          .eq("user_id", userId)
          .select("id")
          .maybeSingle();
        if (error || !data) return;
      } catch {
        return;
      }
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, readAt: n.readAt ?? readAt } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    },
    [userId],
  );

  const markUnread = React.useCallback(
    async (notificationId: string) => {
      if (!userId) return;

      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("notifications")
          .update({ is_read: false, status: "sent", read_at: null })
          .eq("id", notificationId)
          .eq("user_id", userId)
          .select("id")
          .maybeSingle();
        if (error || !data) return;
      } catch {
        return;
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, readAt: null } : n)),
      );
      setUnreadCount((prev) => prev + 1);
    },
    [userId],
  );

  const markAllRead = React.useCallback(async () => {
    if (!userId) return;

    const readAt = new Date().toISOString();
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("notifications")
        .update({ is_read: true, status: "read", read_at: readAt })
        .eq("user_id", userId)
        .or("status.neq.read,read_at.is.null")
        .select("id");
      if (error || (unreadCount > 0 && (!data || data.length === 0))) return;
    } catch {
      return;
    }
    setNotifications((prev) =>
      prev.map((n) => (n.readAt === null ? { ...n, readAt } : n)),
    );
    setUnreadCount(0);
  }, [unreadCount, userId]);

  const visible = React.useMemo(() => {
    if (filter === "unread") return notifications.filter((item) => item.readAt === null);
    return notifications;
  }, [filter, notifications]);

  const grouped = React.useMemo(() => groupNotifications(visible), [visible]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Центр уведомлений"
        title="Уведомления"
        subtitle="Единая лента по заявкам, бронированиям и событиям модерации."
        actions={
          unreadCount > 0 ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => void markAllRead()}
            >
              Прочитать всё
              <Check className="size-4" />
            </Button>
          ) : undefined
        }
      />

      <ToggleGroup
        type="single"
        variant="outline"
        value={filter}
        // Radix single-toggle emits "" on re-click; a feed filter is always set.
        onValueChange={(next) => {
          if (next) setFilter(next as FeedFilter);
        }}
        className="flex-wrap"
      >
        <ToggleGroupItem value="all" className={TOGGLE_ACTIVE_CLASS}>
          Все
          <Badge variant="outline" className="ml-2 bg-background">
            {notifications.length}
          </Badge>
        </ToggleGroupItem>
        <ToggleGroupItem value="unread" className={TOGGLE_ACTIVE_CLASS}>
          Непрочитанные
          <Badge
            variant={unreadCount === 0 ? "outline" : "secondary"}
            className="ml-2 bg-background"
          >
            {unreadCount}
          </Badge>
        </ToggleGroupItem>
      </ToggleGroup>

      <div className="flex flex-col gap-3">
        {loadError ? (
          <EmptyState
            icon={<AlertCircle />}
            title="Не удалось загрузить"
            description="Проверьте соединение и попробуйте ещё раз."
            action={
              <Button
                type="button"
                variant="outline"
                onClick={() => setReloadKey((key) => key + 1)}
              >
                Попробовать снова
              </Button>
            }
          />
        ) : loading ? (
          <div className="flex flex-col gap-3" aria-busy="true">
            <ListRowSkeleton />
            <ListRowSkeleton />
            <ListRowSkeleton />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<Bell />}
            title="Пока пусто"
            description="Новые события появятся здесь."
          />
        ) : (
          <div className="flex flex-col gap-6">
            {grouped.map((group) => (
              <section key={group.key} className="flex flex-col gap-3" aria-label={group.label}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">{group.label}</p>
                  <Separator className="flex-1" />
                </div>
                <div className="grid gap-3">
                  {group.items.map((item) => (
                    <NotificationRow
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

function NotificationRow({
  notification,
  onMarkRead,
  onMarkUnread,
}: {
  notification: NotificationRecord;
  onMarkRead: (id: string) => Promise<void>;
  onMarkUnread: (id: string) => Promise<void>;
}) {
  const isUnread = notification.readAt === null;
  const severityVariant = getSeverityBadgeVariant(notification.severity);
  const [pending, setPending] = React.useState(false);

  const toggleRead = async () => {
    setPending(true);
    try {
      await (isUnread ? onMarkRead : onMarkUnread)(notification.id);
    } finally {
      setPending(false);
    }
  };

  return (
    <ListRow
      leading={
        isUnread ? (
          <span className="inline-flex items-center">
            <Circle className="size-2.5 fill-primary text-primary" />
            <span className="sr-only">Новое</span>
          </span>
        ) : (
          <span className="inline-flex items-center">
            <Circle className="size-2.5 text-muted-foreground" />
            <span className="sr-only">Прочитано</span>
          </span>
        )
      }
      title={
        <span className={isUnread ? "font-semibold text-foreground" : undefined}>
          {notification.title}
        </span>
      }
      subtitle={notification.body}
      badge={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Badge variant={severityVariant}>{labelSeverity(notification.severity)}</Badge>
          <Badge variant="outline" className="bg-background">
            {labelKind(notification.kind)}
          </Badge>
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {formatTimestamp(notification.createdAt)}
          </span>
        </div>
      }
      actions={
        <>
          {notification.href ? (
            <Button asChild size="sm" variant="outline">
              <Link
                href={notification.href}
                onClick={() => {
                  if (isUnread) void onMarkRead(notification.id);
                }}
              >
                Открыть событие
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => void toggleRead()}
          >
            {isUnread ? "Отметить прочитанным" : "Вернуть в непрочитанные"}
          </Button>
        </>
      }
    />
  );
}

function getSeverityBadgeVariant(severity: NotificationSeverity) {
  if (severity === "success") return "success";
  if (severity === "warning") return "warning";
  return "info";
}

function labelSeverity(severity: NotificationSeverity) {
  if (severity === "success") return "Готово";
  if (severity === "warning") return "Важно";
  return "Инфо";
}

function labelKind(kind: NotificationRecord["kind"]) {
  switch (kind) {
    case "new_offer":
      return "Предложение";
    case "offer_expiring":
      return "Срок предложения";
    case "booking_created":
      return "Новое бронирование";
    case "booking_confirmed":
      return "Подтверждение";
    case "booking_cancelled":
      return "Отмена";
    case "booking_completed":
      return "Завершение";
    case "dispute_opened":
      return "Спор";
    case "review_requested":
      return "Отзыв";
    case "admin_alert":
      return "Админ";
    default:
      return "Заявка";
  }
}

function getSeverityForKind(kind: NotificationRecord["kind"]): NotificationSeverity {
  switch (kind) {
    case "booking_confirmed":
    case "booking_completed":
      return "success";
    case "offer_expiring":
    case "booking_cancelled":
    case "dispute_opened":
    case "admin_alert":
      return "warning";
    default:
      return "info";
  }
}

function formatTimestamp(iso: string) {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ru });
  } catch {
    return iso;
  }
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
