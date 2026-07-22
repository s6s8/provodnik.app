"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { ListRowSkeleton } from "@/components/shared/loading-skeletons";
import { messagesApi } from "@/lib/api/messages";
import { queryKeys } from "@/lib/query-keys";
import type { MessageWithSender } from "@/lib/supabase/conversations";
import type { MessageRow } from "@/lib/supabase/types";

import { mergeRealtimeMessage, useRealtimeMessages } from "@/features/messaging/hooks/use-realtime-messages";
import { resolveDisplayName } from "@/lib/profile/resolve-display-name";

import { MessageBubble } from "./message-bubble";

type MarkReadAction = (threadId: string) => Promise<void>;

function formatSenderName(message: MessageWithSender) {
  const resolved =
    message.sender_profile?.full_name?.trim() ||
    message.sender_display_name?.trim();
  if (resolved) return resolved;
  if (message.sender_role === "guide") {
    return resolveDisplayName("guide", {});
  }
  if (message.sender_role === "traveler") {
    return resolveDisplayName("traveler", {}, { context: "trusted" });
  }
  if (message.sender_role === "admin") return "Администратор";
  return "Система";
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
        (current = []) => mergeRealtimeMessage(current, message),
      );

      void queryClient.invalidateQueries({
        queryKey: queryKeys.messages.threads(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.messages.unreadCount(),
      });

      if (message.sender_id !== currentUserId) {
        void markReadAction(threadId).then(() => {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.messages.unreadCount(),
          });
        });
      }
    },
    [currentUserId, markReadAction, queryClient, threadId],
  );

  useEffect(() => {
    void markReadAction(threadId).then(() => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.messages.unreadCount(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.messages.threads(),
      });
    });
  }, [markReadAction, queryClient, threadId]);

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
      <div
        aria-busy="true"
        className="grid gap-3.5 p-4 max-h-[min(60vh,42rem)] max-md:max-h-none max-md:min-h-[50vh] overflow-y-auto"
      >
        <ListRowSkeleton />
        <ListRowSkeleton />
        <ListRowSkeleton />
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
