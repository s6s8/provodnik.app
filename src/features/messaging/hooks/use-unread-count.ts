"use client";

import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { messagesApi } from "@/lib/api/messages";
import { hasSupabaseEnv } from "@/lib/env";
import { queryKeys } from "@/lib/query-keys";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type UnreadCountQueryKey = ReturnType<typeof queryKeys.messages.unreadCount>;
type UnreadCountPayload = { unreadCount: number; userId: string | null };

function fetchUnreadCount(_queryKey: UnreadCountQueryKey) {
  return messagesApi.unreadCount();
}

function isMessageThreadNotification(row: { event_type?: string | null; kind?: string | null }) {
  const eventName = row.event_type ?? row.kind ?? "";
  return eventName.includes("message") || eventName.includes("thread");
}

const EMPTY_UNREAD_COUNT: UnreadCountPayload = { unreadCount: 0, userId: null };

export function useUnreadCount(enabled = true) {
  const unreadCountQueryKey = useMemo(() => queryKeys.messages.unreadCount(), []);
  const queryClient = useQueryClient();
  const canFetch = enabled;

  const { data = EMPTY_UNREAD_COUNT, refetch } = useQuery({
    queryKey: unreadCountQueryKey,
    queryFn: () => fetchUnreadCount(unreadCountQueryKey),
    enabled: canFetch,
    retry: false,
    staleTime: 30_000,
    placeholderData: EMPTY_UNREAD_COUNT,
  });

  const unreadCount = canFetch ? data.unreadCount : 0;
  const userId = canFetch ? data.userId : null;

  useEffect(() => {
    if (!canFetch || !userId || !hasSupabaseEnv()) {
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
        (payload: { new: { event_type?: string | null; kind?: string | null } }) => {
          if (!isMessageThreadNotification(payload.new)) {
            return;
          }
          queryClient.setQueryData<UnreadCountPayload>(
            unreadCountQueryKey,
            (current: UnreadCountPayload | undefined) => ({
              unreadCount: (current?.unreadCount ?? 0) + 1,
              userId,
            }),
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [canFetch, queryClient, unreadCountQueryKey, userId]);

  return {
    unreadCount,
    refetch,
  };
}
