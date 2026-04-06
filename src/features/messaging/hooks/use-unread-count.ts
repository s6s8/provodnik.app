"use client";

import { useCallback, useEffect, useState } from "react";

import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type UnreadCountResponse = {
  unreadCount: number;
  userId: string | null;
};

export function useUnreadCount(enabled = true) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!enabled || !hasSupabaseEnv()) {
      setUnreadCount(0);
      setUserId(null);
      return;
    }

    const response = await fetch("/api/messages/unread-count", {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      setUnreadCount(0);
      setUserId(null);
      return;
    }

    const payload = (await response.json()) as UnreadCountResponse;
    setUnreadCount(payload.unreadCount);
    setUserId(payload.userId);
  }, [enabled]);

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
        () => {
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
