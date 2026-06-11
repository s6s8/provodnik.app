export const queryKeys = {
  messages: {
    threadMessages: (threadId: string) => ["thread-messages", threadId] as const,
    threads: () => ["message-threads"] as const,
    unreadCount: () => ["unread-count"] as const,
  },
} as const;
