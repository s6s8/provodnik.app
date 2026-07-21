"use client";

import { useEffect } from "react";

import { hasSupabaseEnv } from "@/lib/env";
import { maskPii } from "@/lib/pii/mask";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { MessageWithSender } from "@/lib/supabase/conversations";
import type { MessageRow } from "@/lib/supabase/types";

interface UseRealtimeMessagesOptions {
  threadId: string;
  onNewMessage: (message: MessageRow) => void;
}

/**
 * Merge a realtime INSERT payload into the cached thread messages.
 * Dedupes by id and masks the body — PII-012: realtime rows carry the raw DB
 * body, so contact details must be masked here to match the load paths.
 *
 * D21-8: the realtime row is the raw `messages` record with no sender join, so
 * reuse the identity `getThreadMessages` already resolved for that sender in
 * this thread. Unknown sender still falls back to null → «Участник».
 */
export function mergeRealtimeMessage(
  current: MessageWithSender[],
  message: MessageRow,
): MessageWithSender[] {
  if (current.some((item) => item.id === message.id)) {
    return current;
  }

  const known = message.sender_id
    ? current.findLast((item) => item.sender_id === message.sender_id)
    : undefined;

  return [
    ...current,
    {
      ...message,
      body: maskPii(message.body),
      sender_profile: known?.sender_profile ?? null,
      sender_display_name: known?.sender_display_name ?? null,
    },
  ];
}

export function useRealtimeMessages({
  threadId,
  onNewMessage,
}: UseRealtimeMessagesOptions) {
  useEffect(() => {
    if (!hasSupabaseEnv()) {
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`thread:${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          onNewMessage(payload.new as MessageRow);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [onNewMessage, threadId]);
}
