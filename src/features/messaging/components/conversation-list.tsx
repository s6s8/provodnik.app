"use client";

import { useQuery } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  const { data: threads = initialThreads, isError } = useQuery({
    queryKey: ["message-threads"],
    queryFn: fetchThreads,
    initialData: initialThreads,
  });

  if (!threads.length) {
    if (serverError || isError) {
      return (
        <EmptyState
          title="Не удалось загрузить"
          description="Попробуйте обновить страницу."
        />
      );
    }

    const isGuide = viewerRole === "guide";
    return (
      <EmptyState
        icon={<MessageSquare />}
        title="Пока нет сообщений"
        description={
          isGuide
            ? "Здесь появятся переписки с путешественниками."
            : "Здесь появятся переписки с гидами."
        }
        action={
          isGuide ? undefined : (
            <Button asChild>
              <Link href="/listings">Найти тур</Link>
            </Button>
          )
        }
      />
    );
  }

  return (
    <div className="grid gap-3.5">
      {threads.map((thread) => {
        const title = thread.other_participant_names.join(", ") || "Диалог";

        return (
          <ListRow
            key={thread.id}
            href={`/messages/${thread.id}`}
            leading={
              <Avatar className="size-12" aria-hidden="true">
                <AvatarFallback className="bg-primary/10 text-primary font-display text-xl font-semibold">
                  {title.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            }
            title={title}
            subtitle={thread.last_message_preview ?? "Диалог создан. Начните переписку."}
            badge={thread.unread ? <Badge variant="default">Новое</Badge> : undefined}
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
