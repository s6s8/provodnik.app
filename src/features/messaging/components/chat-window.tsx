"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef } from "react";

import type { MessageWithSender } from "@/lib/supabase/conversations";
import type { MessageRow } from "@/lib/supabase/types";

import { useRealtimeMessages } from "@/features/messaging/hooks/use-realtime-messages";

import { MessageBubble } from "./message-bubble";

type MarkReadAction = (threadId: string) => Promise<void>;

async function fetchMessages(threadId: string) {
  const response = await fetch(`/api/messages/threads/${threadId}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Не удалось загрузить сообщения.");
  }

  return (await response.json()) as MessageWithSender[];
}

function formatSenderName(message: MessageWithSender) {
  return message.sender_profile?.full_name?.trim() || "Участник";
}

interface ChatWindowProps {
  threadId: string;
  currentUserId: string;
  initialMessages: MessageWithSender[];
  markReadAction: MarkReadAction;
}

export function ChatWindow({
  threadId,
  currentUserId,
  initialMessages,
  markReadAction,
}: ChatWindowProps) {
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const { data: messages = initialMessages, isFetching } = useQuery({
    queryKey: ["thread-messages", threadId],
    queryFn: () => fetchMessages(threadId),
    initialData: initialMessages,
  });

  const handleNewMessage = useCallback(
    (message: MessageRow) => {
      queryClient.setQueryData<MessageWithSender[]>(
        ["thread-messages", threadId],
        (current = []) => {
          if (current.some((item) => item.id === message.id)) {
            return current;
          }

          return [
            ...current,
            {
              ...message,
              sender_profile: null,
            },
          ];
        },
      );

      void queryClient.invalidateQueries({ queryKey: ["message-threads"] });

      if (message.sender_id !== currentUserId) {
        void markReadAction(threadId);
      }
    },
    [currentUserId, markReadAction, queryClient, threadId],
  );

  useRealtimeMessages({
    threadId,
    onNewMessage: handleNewMessage,
  });

  const renderedMessages = useMemo(() => messages, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [renderedMessages]);

  if (!renderedMessages.length && isFetching) {
    return (
      <div className="chat-window-shell">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={
              index % 2 === 0 ? "message-bubble-row" : "message-bubble-row message-bubble-row-own"
            }
          >
            <div className="message-bubble-shell">
              <div className="message-bubble-skeleton" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="chat-window-shell">
      {renderedMessages.map((message) => {
        const isOwn = message.sender_id === currentUserId;

        return (
          <MessageBubble
            key={message.id}
            body={message.body}
            senderName={formatSenderName(message)}
            senderAvatar={message.sender_profile?.avatar_url ?? null}
            timestamp={message.created_at}
            isOwn={isOwn}
          />
        );
      })}
      <div ref={scrollRef} />
    </div>
  );
}
