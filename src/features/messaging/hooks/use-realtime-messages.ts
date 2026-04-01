"use client";

import { useEffect } from "react";

import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { MessageRow } from "@/lib/supabase/types";

interface UseRealtimeMessagesOptions {
  threadId: string;
  onNewMessage: (message: MessageRow) => void;
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
