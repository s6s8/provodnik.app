import type { MessageWithSender } from "@/lib/supabase/conversations";

type UnreadCountResponse = {
  unreadCount: number;
  userId: string | null;
};

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`request_failed:${response.status}`);
  }

  return (await response.json()) as T;
}

export const messagesApi = {
  threadMessages: (threadId: string) =>
    getJson<MessageWithSender[]>(`/api/messages/threads/${threadId}`),
  unreadCount: () =>
    getJson<UnreadCountResponse>("/api/messages/unread-count"),
};
