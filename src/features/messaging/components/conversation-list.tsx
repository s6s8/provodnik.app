"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { UserThreadSummary } from "@/lib/supabase/conversations";

function formatThreadTimestamp(timestamp: string | null) {
  if (!timestamp) {
    return "Без сообщений";
  }

  const date = new Date(timestamp);
  const now = new Date();
  const isSameDay = date.toDateString() === now.toDateString();

  if (isSameDay) {
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
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
}

export function ConversationList({
  initialThreads,
}: ConversationListProps) {
  const { data: threads = initialThreads } = useQuery({
    queryKey: ["message-threads"],
    queryFn: fetchThreads,
    initialData: initialThreads,
  });

  if (!threads.length) {
    return (
      <div className="p-[clamp(1.5rem,4vw,2.25rem)] bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass">
        <p className="text-base font-semibold text-foreground">У вас пока нет сообщений</p>
        <p className="mt-2 text-[0.9375rem] leading-[1.6] text-muted-foreground">
          Когда вы начнёте диалог с гидом, он появится здесь.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3.5">
      {threads.map((thread) => {
        const title = thread.other_participant_names.join(", ") || "Диалог";

        return (
          <Link
            key={thread.id}
            href={`/messages/${thread.id}`}
            className="flex items-center gap-4 p-4 rounded-card bg-surface-high shadow-card transition-[transform,box-shadow] duration-150 hover:-translate-y-[3px] hover:shadow-glass max-md:items-start"
          >
            <Avatar className="size-12" aria-hidden="true">
              <AvatarFallback className="bg-primary/10 text-primary font-display text-xl font-semibold">
                {title.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 grid gap-1">
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-foreground">{title}</p>
                {thread.unread ? <span className="size-2 rounded-full bg-primary shrink-0" aria-hidden="true" /> : null}
              </div>
              <p className="text-sm leading-[1.55] text-muted-foreground truncate">
                {thread.last_message_preview ?? "Диалог создан. Начните переписку."}
              </p>
            </div>
            <time
              className="shrink-0 text-xs font-medium text-muted-foreground max-md:hidden"
              dateTime={thread.last_message_created_at ?? undefined}
            >
              {formatThreadTimestamp(thread.last_message_created_at)}
            </time>
          </Link>
        );
      })}
    </div>
  );
}
