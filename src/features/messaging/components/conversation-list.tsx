"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

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
      <div className="messages-empty-state glass-card">
        <p className="messages-empty-title">У вас пока нет сообщений</p>
        <p className="messages-empty-copy">
          Когда вы начнёте диалог с гидом, он появится здесь.
        </p>
      </div>
    );
  }

  return (
    <div className="messages-list-shell">
      {threads.map((thread) => {
        const title = thread.other_participant_names.join(", ") || "Диалог";

        return (
          <Link
            key={thread.id}
            href={`/messages/${thread.id}`}
            className="messages-thread-row"
          >
            <div className="messages-thread-avatar" aria-hidden="true">
              {title.charAt(0).toUpperCase()}
            </div>
            <div className="messages-thread-copy">
              <div className="messages-thread-heading">
                <p className="messages-thread-title">{title}</p>
                {thread.unread ? <span className="messages-thread-dot" aria-hidden="true" /> : null}
              </div>
              <p className="messages-thread-preview">
                {thread.last_message_preview ?? "Диалог создан. Начните переписку."}
              </p>
            </div>
            <time className="messages-thread-time" dateTime={thread.last_message_created_at ?? undefined}>
              {formatThreadTimestamp(thread.last_message_created_at)}
            </time>
          </Link>
        );
      })}
    </div>
  );
}
