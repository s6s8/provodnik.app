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
 */
export function mergeRealtimeMessage(
  current: MessageWithSender[],
  message: MessageRow,
): MessageWithSender[] {
  if (current.some((item) => item.id === message.id)) {
    return current;
  }

  return [
    ...current,
    {
      ...message,
      body: maskPii(message.body),
      sender_profile: null,
      sender_display_name: null,
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
