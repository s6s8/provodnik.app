"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { messagesApi } from "@/lib/api/messages";
import { queryKeys } from "@/lib/query-keys";
import type { MessageWithSender } from "@/lib/supabase/conversations";
import type { MessageRow } from "@/lib/supabase/types";

import { useRealtimeMessages } from "@/features/messaging/hooks/use-realtime-messages";

import { MessageBubble } from "./message-bubble";

type MarkReadAction = (threadId: string) => Promise<void>;

function formatSenderName(message: MessageWithSender) {
  return (
    message.sender_profile?.full_name?.trim() ||
    message.sender_display_name?.trim() ||
    "Участник"
  );
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
    queryKey: queryKeys.messages.threadMessages(threadId),
    queryFn: () => messagesApi.threadMessages(threadId),
    initialData: initialMessages,
  });

  const handleNewMessage = useCallback(
    (message: MessageRow) => {
      queryClient.setQueryData<MessageWithSender[]>(
        queryKeys.messages.threadMessages(threadId),
        (current = []) => {
          if (current.some((item) => item.id === message.id)) {
            return current;
          }

          return [
            ...current,
            {
              ...message,
              sender_profile: null,
              sender_display_name: null,
            },
          ];
        },
      );

      void queryClient.invalidateQueries({
        queryKey: queryKeys.messages.threads(),
      });

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
      <div className="grid gap-3.5 p-4 max-h-[min(60vh,42rem)] max-md:max-h-none max-md:min-h-[50vh] overflow-y-auto">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={
              index % 2 === 0 ? "flex justify-start" : "flex justify-end"
            }
          >
            <div className="grid gap-2.5 max-w-[min(100%,38rem)] px-4 py-3.5 rounded-[1.5rem] bg-card border border-border shadow-sm">
              <div className="w-64 h-20 rounded-[1rem] bg-muted relative overflow-hidden" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!renderedMessages.length && !isFetching) {
    return (
      <div className="flex items-center justify-center p-8">
        <EmptyState
          icon={<MessageSquare className="size-6" />}
          title="Нет сообщений"
          description="Начните переписку — отправьте первое сообщение."
        />
      </div>
    );
  }

  return (
    <div className="grid gap-3.5 p-4 max-h-[min(60vh,42rem)] max-md:max-h-none max-md:min-h-[50vh] overflow-y-auto">
      {renderedMessages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          currentUserId={currentUserId}
          senderName={formatSenderName(message)}
          senderAvatar={message.sender_profile?.avatar_url ?? null}
        />
      ))}
      <div ref={scrollRef} />
    </div>
  );
}
