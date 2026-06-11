"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { messagesApi } from "@/lib/api/messages";
import { hasSupabaseEnv } from "@/lib/env";
import { queryKeys } from "@/lib/query-keys";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type UnreadCountQueryKey = ReturnType<typeof queryKeys.messages.unreadCount>;

function fetchUnreadCount(_queryKey: UnreadCountQueryKey) {
  return messagesApi.unreadCount();
}

function isMessageThreadNotification(row: { event_type?: string | null; kind?: string | null }) {
  const eventName = row.event_type ?? row.kind ?? "";
  return eventName.includes("message") || eventName.includes("thread");
}

export function useUnreadCount(enabled = true) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const unreadCountQueryKey = useMemo(() => queryKeys.messages.unreadCount(), []);

  const refetch = useCallback(async () => {
    if (!enabled || !hasSupabaseEnv()) {
      setUnreadCount(0);
      setUserId(null);
      return;
    }

    try {
      const payload = await fetchUnreadCount(unreadCountQueryKey);
      setUnreadCount(payload.unreadCount);
      setUserId(payload.userId);
    } catch {
      setUnreadCount(0);
      setUserId(null);
    }
  }, [enabled, unreadCountQueryKey]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refetch();
  }, [refetch]);

  useEffect(() => {
    if (!enabled || !userId || !hasSupabaseEnv()) {
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (!isMessageThreadNotification(payload.new as { event_type?: string | null; kind?: string | null })) {
            return;
          }
          setUnreadCount((count) => count + 1);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, userId]);

  return {
    unreadCount,
    refetch,
  };
}
