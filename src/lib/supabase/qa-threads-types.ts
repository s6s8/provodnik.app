export interface QaMessage {
  id: string;
  sender_role: "traveler" | "guide" | "system" | "admin";
  body: string;
  created_at: string;
}

export interface QaThread {
  thread_id: string;
  messages: QaMessage[];
  message_count: number;
  at_limit: boolean;
}

export const QA_MESSAGE_LIMIT = 8;
