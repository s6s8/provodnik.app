"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Circle, MessageSquare } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ListRow } from "@/components/shared/list-row";
import { formatRussianDate, formatRussianTime } from "@/lib/dates";
import type { UserThreadSummary } from "@/lib/supabase/conversations";

const moscowDayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow" });

function formatThreadTimestamp(timestamp: string | null) {
  if (!timestamp) {
    return "Без сообщений";
  }

  const isSameDay =
    moscowDayKey.format(new Date(timestamp)) === moscowDayKey.format(new Date());

  return isSameDay ? formatRussianTime(timestamp) : formatRussianDate(timestamp);
}

async function fetchThreads() {
  const response = await fetch("/api/messages/threads", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Не удалось загрузить диалоги.");
  }

  return (await response.json()) as UserThreadSummary[];
}

interface ConversationListProps {
  initialThreads: UserThreadSummary[];
  error?: boolean;
  viewerRole?: string | null;
}

export function ConversationList({
  initialThreads,
  error: serverError = false,
  viewerRole = null,
}: ConversationListProps) {
  const {
    data: threads = initialThreads,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["message-threads"],
    queryFn: fetchThreads,
    initialData: initialThreads,
  });

  if (!threads.length) {
    if (serverError || isError) {
      return (
        <EmptyState
          icon={<AlertCircle className="size-6" />}
          title="Не удалось загрузить"
          description="Диалоги не загрузились. Попробуйте ещё раз."
          action={
            <Button
              type="button"
              variant="outline"
              disabled={isFetching}
              onClick={() => {
                void refetch();
              }}
            >
              Обновить
            </Button>
          }
        />
      );
    }

    const isGuide = viewerRole === "guide";
    return (
      <EmptyState
        icon={<MessageSquare className="size-6" />}
        title="Пока нет сообщений"
        description={
          isGuide
            ? "Здесь появятся переписки с путешественниками."
            : "Здесь появятся переписки с гидами."
        }
        action={
          isGuide ? undefined : (
            <Button asChild>
              <Link href="/">Создать запрос</Link>
            </Button>
          )
        }
      />
    );
  }

  return (
    <div className="grid gap-3">
      {threads.map((thread) => {
        const title = thread.other_participant_names.join(", ") || "Диалог";

        return (
          <ListRow
            key={thread.id}
            href={`/messages/${thread.id}`}
            leading={
              <div className="flex items-center gap-3">
                {thread.unread ? (
                  <span className="inline-flex items-center">
                    <Circle className="size-2.5 fill-primary text-primary" />
                    <span className="sr-only">Новое</span>
                  </span>
                ) : (
                  <span className="size-2.5" aria-hidden="true" />
                )}
                <Avatar className="size-12" aria-hidden="true">
                  <AvatarFallback className="bg-primary/10 text-primary font-display text-xl font-semibold">
                    {title.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            }
            title={
              <span className={thread.unread ? "font-semibold text-foreground" : undefined}>
                {title}
              </span>
            }
            subtitle={thread.last_message_preview ?? "Диалог создан. Начните переписку."}
            actions={
              <time
                className="text-xs font-medium text-muted-foreground"
                dateTime={thread.last_message_created_at ?? undefined}
              >
                {formatThreadTimestamp(thread.last_message_created_at)}
              </time>
            }
          />
        );
      })}
    </div>
  );
}
